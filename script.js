const axios = require('axios');

async function runTask() {
  try {
    // 第一步：获取 Token
    const tokenResponse = await axios.get('https://wmh.opalvision.net:9001/api/system/app/getOpenToken?openId=odCuL64BaooW5QrpVPkM0STkfgIs');
    const token = tokenResponse.data.token;

    console.log('获取到的 Token:', token);

    // 第二步：获取通知列表
    const noticeResponse = await axios.get('https://wmh.opalvision.net:9001/api/system/app/getNoticFiveListPage', {
      params: {
        pageNum: 1,
        pageSize: 6,
        deptId: 101,
        status: ''
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('通知列表:', noticeResponse.data);
  } catch (error) {
    console.error('发生错误:', error.message);
  }
}

runTask();