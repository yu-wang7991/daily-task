const axios = require('axios');
const dayjs = require('dayjs');

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
  const startTime = dayjs().hour(startHour).minute(startMinute).second(0);
  const endTime = dayjs().hour(endHour).minute(endMinute).second(0);
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
    // 当前日期
    const today = dayjs();
    console.log('当前日期:', today.format('YYYY-MM-DD'));

    // 如果是非工作日（包括周末和节假日），则不执行
    if (isNonWorkingDay(today)) {
      console.log('今天是非工作日，跳过打卡任务。');
      return;
    }

    // 第一步：获取 Token
    const tokenResponse = await axios.get('https://wmh.opalvision.net:9001/api/system/app/getOpenToken?openId=odCuL64BaooW5QrpVPkM0STkfgIs');
    const token = tokenResponse.data.token;

    console.log('获取到的 Token:', token);

    // 上班打卡时间（08:20 至 08:30）
    const shangbanTime = getRandomTimeInRange(9, 8, 9, 10);
    console.log('随机上班打卡时间:', shangbanTime.format('YYYY-MM-DD HH:mm:ss'));

    // 修改等待时间计算逻辑
    const now = dayjs();
    const targetTime = dayjs(shangbanTime).year(now.year()).month(now.month()).date(now.date());

    if (now.isBefore(targetTime)) {
      const waitTime = targetTime.diff(now, 'millisecond');
      if (waitTime > 0) {
        console.log(`等待 ${Math.round(waitTime / 1000)} 秒后执行上班打卡...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // 上班打卡
    const shangbanResponse = await axios.get('https://wmh.opalvision.net:9001/api/attendance/app/clock', {
      // const shangbanResponse = await axios.get('https://fanyi.baidu.com/mtpe-individual/multimodal?aldtype=16047#/auto/zh', {
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
  } catch (error) {
    console.error('发生错误:', error.message);
  }
}

runTask();