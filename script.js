const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// 添加时区插件
dayjs.extend(utc);
dayjs.extend(timezone);
// 设置默认时区为中国时区
dayjs.tz.setDefault('Asia/Shanghai');

// 动态获取当前年份
const currentYear = dayjs().year();

// 节假日列表（示例：当前年份的部分节假日）
const holidays = [
  `${currentYear}-01-01`, // 元旦
  `${currentYear}-01-21`, // 春节
  `${currentYear}-01-22`,
  `${currentYear}-01-23`,
  `${currentYear}-01-24`,
  `${currentYear}-01-25`,
  `${currentYear}-01-26`,
  `${currentYear}-01-27`,
  `${currentYear}-04-05`, // 清明节
  `${currentYear}-05-01`, // 劳动节
  `${currentYear}-06-22`, // 端午节
  `${currentYear}-09-29`, // 中秋节
  `${currentYear}-10-01`, // 国庆节
  `${currentYear}-10-02`,
  `${currentYear}-10-03`,
  `${currentYear}-10-04`,
  `${currentYear}-10-05`,
  `${currentYear}-10-06`,
];

// 判断是否为节假日或周末
function isNonWorkingDay(date = dayjs()) {
  if (!date || typeof date.format !== 'function') {
    throw new Error('date 参数无效');
  }

  const formattedDate = date.format('YYYY-MM-DD');
  const dayOfWeek = date.day(); // 0: Sunday, 1: Monday, ..., 6: Saturday

  // 检查是否为周末（周六或周日）
  if (dayOfWeek === 6 || dayOfWeek === 0) { // 周六和周日
    return true;
  }

  // 检查是否为节假日
  return holidays.includes(formattedDate);
}

async function runTask() {
  try {
    console.log('==== 任务开始执行 ====');
    console.log('系统环境时区:', process.env.TZ);
    console.log('当前时间戳:', Date.now());
    console.log('当前系统时间:', new Date().toString());
    console.log('打卡时间范围: 08:20-08:30');

    const now = dayjs().tz('Asia/Shanghai');
    console.log('当前北京时间:', now.format('YYYY-MM-DD HH:mm:ss'));

    // 判断当前时间是否在打卡时间范围内
    const hour = now.hour();
    const minute = now.minute();
    const currentMinutes = hour * 60 + minute;
    const startMinutes = 8 * 60 + 20;
    const endMinutes = 8 * 60 + 30;

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      console.log('当前时间不在打卡时间范围内（08:20-08:30）');
      return;
    }

    // 如果是非工作日，则不执行
    if (isNonWorkingDay(now)) {
      console.log('今天是非工作日，跳过打卡任务。');
      console.log('日期详情:', {
        formattedDate: now.format('YYYY-MM-DD'),
        dayOfWeek: now.day(),
        isHoliday: holidays.includes(now.format('YYYY-MM-DD'))
      });
      return;
    }

    console.log('今天是工作日，开始执行打卡任务...');

    // 获取 Token
    console.log('正在获取 Token...');
    const tokenResponse = await axios.get('https://wmh.opalvision.net:9001/api/system/app/getOpenToken?openId=odCuL64BaooW5QrpVPkM0STkfgIs');
    const token = tokenResponse.data.token;
    console.log('获取到的 Token:', token);

    // 使用当前时间作为打卡时间
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const shangbanResponse = await axios.post('https://wmh.opalvision.net:9001/api/attendance/app/clock', {
          address: "江苏省扬州市邗江区新城河路46正北方向50米停车场",
          latitude: 32.37548584197275,
          longitude: 119.40709095248346,
          remote: 0,
          clockTime: now.format('YYYY-MM-DD HH:mm:ss'),
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('打卡请求成功完成');
        console.log('打卡时间:', now.format('YYYY-MM-DD HH:mm:ss'));
        console.log('服务器响应:', shangbanResponse.data);
        break;
      } catch (error) {
        retryCount++;
        console.error(`打卡失败 (尝试 ${retryCount}/${maxRetries}):`, error.message);
        if (retryCount === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('==== 任务执行完成 ====');
  } catch (error) {
    console.error('任务执行失败:', error);
    throw error;
  }
}

runTask();