const axios = require('axios');
const moment = require('moment-timezone');

// 设置默认时区
moment.tz.setDefault('Asia/Shanghai');

// 动态获取当前年份
const currentYear = moment().year();

// 2024年节假日安排（根据国务院办公厅通知）
const holidays = [
  `${currentYear}-01-01`, // 元旦
  `${currentYear}-02-10`, // 春节
  `${currentYear}-02-11`,
  `${currentYear}-02-12`,
  `${currentYear}-02-13`,
  `${currentYear}-02-14`,
  `${currentYear}-02-15`,
  `${currentYear}-02-16`,
  `${currentYear}-02-17`,
  `${currentYear}-04-04`, // 清明节
  `${currentYear}-04-05`,
  `${currentYear}-04-06`,
  `${currentYear}-05-01`, // 劳动节
  `${currentYear}-05-02`,
  `${currentYear}-05-03`,
  `${currentYear}-05-04`,
  `${currentYear}-05-05`,
  `${currentYear}-06-10`, // 端午节
  `${currentYear}-09-15`, // 中秋节
  `${currentYear}-09-16`,
  `${currentYear}-09-17`,
  `${currentYear}-10-01`, // 国庆节
  `${currentYear}-10-02`,
  `${currentYear}-10-03`,
  `${currentYear}-10-04`,
  `${currentYear}-10-05`,
  `${currentYear}-10-06`,
  `${currentYear}-10-07`,
];

// 判断是否为节假日或周末
function isNonWorkingDay(date = moment()) {
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
    console.log('==========================================');
    console.log(`任务启动时间: ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}`);

    // 增加更多时间调试信息
    console.log('时间诊断信息:');
    console.log(`- 原始系统时间: ${new Date()}`);
    console.log(`- Moment时间: ${moment().format()}`);
    console.log(`- Moment时区: ${moment().tz()}`);
    console.log(`- 环境变量TZ: ${process.env.TZ}`);

    // 使用系统时间（中国时区）
    const now = moment();

    // 增加时区验证
    if (now.tz() !== 'Asia/Shanghai') {
      console.error('警告：当前时区不是中国时区！');
      console.log('尝试强制设置时区...');
      now.tz('Asia/Shanghai');
    }

    console.log('当前时间信息:');
    console.log('系统时间:', now.format('YYYY-MM-DD HH:mm:ss'));
    console.log('时区:', now.tz());
    console.log('时间戳:', now.valueOf());

    const targetTime = moment().set({ hour: 8, minute: 25 });
    const timeDiff = Math.abs(now.diff(targetTime, 'minutes'));

    console.log('时间检查:');
    console.log(`目标执行时间: 08:25`);
    console.log(`当前时间: ${now.format('HH:mm')}`);
    console.log(`时间差: ${timeDiff}分钟`);

    // 允许 5 分钟的误差范围
    if (timeDiff > 5) {
      console.log('⚠️ 当前时间不在预期执行时间范围内');
      process.exit(1);
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
        // 修改打卡请求时间格式
        const clockTime = now.format('YYYY-MM-DD HH:mm:ss');
        const shangbanResponse = await axios.post('https://wmh.opalvision.net:9001/api/attendance/app/clock', {
          address: "江苏省扬州市邗江区新城河路46正北方向50米停车场",
          latitude: 32.37548584197275,
          longitude: 119.40709095248346,
          remote: 0,
          clockTime: clockTime,
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
    console.error('❌ 任务执行失败:', error.message);
    console.error('详细错误信息:', error.stack);
    console.error('请求信息:', {
      时间: moment().format('YYYY-MM-DD HH:mm:ss'),
      错误类型: error.name,
      状态码: error.response?.status,
      响应数据: error.response?.data
    });
    process.exit(1);
  }
}

// 增强错误处理
process.on('unhandledRejection', (error) => {
  console.error('未处理的Promise拒绝:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

runTask();