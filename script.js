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

// 获取随机时间（范围内的随机分钟数）
function getRandomTimeInRange(startHour, startMinute, endHour, endMinute) {
  const startTime = dayjs().tz('Asia/Shanghai').hour(startHour).minute(startMinute).second(0);
  const endTime = dayjs().tz('Asia/Shanghai').hour(endHour).minute(endMinute).second(0);
  const randomMinutes = Math.floor(Math.random() * (endTime.diff(startTime, 'minute') + 1));
  return startTime.add(randomMinutes, 'minute');
}

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
    // 添加更多日志输出
    console.log('==== 任务开始执行 ====');
    console.log('系统环境时区:', process.env.TZ);

    // 当前日期（使用北京时间）
    const today = dayjs().tz('Asia/Shanghai');
    console.log('当前北京时间:', today.format('YYYY-MM-DD HH:mm:ss'));

    // 如果是非工作日（包括周末和节假日），则不执行
    if (isNonWorkingDay(today)) {
      console.log('今天是非工作日，跳过打卡任务。');
      return;
    }

    // 第一步：获取 Token
    const tokenResponse = await axios.get('https://wmh.opalvision.net:9001/api/system/app/getOpenToken?openId=odCuL64BaooW5QrpVPkM0STkfgIs');
    const token = tokenResponse.data.token;

    console.log('获取到的 Token:', token);

    // 修改上班打卡时间范围（北京时间 08:20 至 08:25）
    const shangbanTime = getRandomTimeInRange(8, 20, 8, 25);
    const now = dayjs().tz('Asia/Shanghai');

    // 如果当前时间已经超过了今天的打卡时间范围，直接退出
    if (now.hour() > 8 || (now.hour() === 8 && now.minute() >= 25)) {
      console.log('当前时间已超过打卡时间范围，退出任务');
      return;
    }

    // 计算需要等待的时间
    const waitTime = shangbanTime.diff(now);
    console.log('当前时间:', now.format('YYYY-MM-DD HH:mm:ss'));
    console.log('目标打卡时间:', shangbanTime.format('YYYY-MM-DD HH:mm:ss'));
    console.log(`需要等待: ${Math.floor(waitTime / 1000)} 秒`);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // 上班打卡
    const shangbanResponse = await axios.get('https://wmh.opalvision.net:9001/api/attendance/app/clock', {
      params: {
        address: "江苏省扬州市邗江区新城河路46正北方向50米停车场",
        latitude: 32.37548584197275,
        longitude: 119.40709095248346,
        remote: 0,
        clockTime: shangbanTime.format('YYYY-MM-DD HH:mm:ss'),
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('上班打卡成功:', shangbanResponse.data);

    console.log('==== 任务执行完成 ====');
  } catch (error) {
    console.error('任务执行失败:', error);
    // 抛出错误以确保 GitHub Actions 能够捕获到失败状态
    throw error;
  }
}

runTask();