/**
 * 时间工具函数
 */

/**
 * 格式化时间为字符串
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串，支持 HH:mm、HH:mm:ss、YYYY-MM-DD等
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (date, format = 'HH:mm') => {
  const d = new Date(date);
  
  const pad = (n) => n.toString().padStart(2, '0');
  
  const replacements = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };
  
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => replacements[match]);
};

/**
 * 计算距离现在还有多久
 * @param {Date} targetTime - 目标时间
 * @returns {string} 距离现在的时间描述
 */
export const getTimeUntil = (targetTime) => {
  const now = new Date();
  const target = new Date(targetTime);
  
  if (target <= now) {
    return '已过期';
  }
  
  const diffMs = target - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}小时${diffMinutes}分钟后`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟后`;
  } else {
    return '即将开始';
  }
};

/**
 * 获取星期几的中文名称
 * @param {number} day - 星期几的数字（0-6，0代表星期日）
 * @returns {string} 星期几的中文名称
 */
export const getChineseWeekday = (day) => {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return weekdays[day];
};

/**
 * 解析重复规则
 * @param {Array} repeatDays - 重复的天数数组 [0,1,2,3,4,5,6]
 * @returns {string} 重复规则的描述
 */
export const parseRepeatRule = (repeatDays) => {
  if (!repeatDays || repeatDays.length === 0) {
    return '仅一次';
  }
  
  if (repeatDays.length === 7) {
    return '每天';
  }
  
  if (repeatDays.length === 5 && 
      repeatDays.includes(1) && repeatDays.includes(2) && 
      repeatDays.includes(3) && repeatDays.includes(4) && 
      repeatDays.includes(5)) {
    return '工作日';
  }
  
  if (repeatDays.length === 2 && 
      repeatDays.includes(0) && repeatDays.includes(6)) {
    return '周末';
  }
  
  const days = repeatDays
    .sort((a, b) => a - b)
    .map(day => getChineseWeekday(day))
    .join('、');
    
  return `每周${days}`;
};

/**
 * 检查当前时间是否在闹钟的重复规则内
 * @param {Object} alarm - 闹钟对象
 * @returns {boolean} 是否应该触发
 */
export const shouldTriggerAlarm = (alarm) => {
  if (!alarm.isActive) {
    return false;
  }
  
  const now = new Date();
  const alarmTime = new Date(alarm.time);
  
  // 如果是一次性闹钟，检查时间是否匹配
  if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
    return (
      now.getHours() === alarmTime.getHours() &&
      now.getMinutes() === alarmTime.getMinutes()
    );
  }
  
  // 如果是重复闹钟，检查当前星期几是否在重复规则中
  const currentDay = now.getDay();
  return alarm.repeatDays.includes(currentDay);
};

/**
 * 生成下一个闹钟触发时间
 * @param {Object} alarm - 闹钟对象
 * @returns {Date} 下一个触发时间
 */
export const getNextTriggerTime = (alarm) => {
  const now = new Date();
  const alarmTime = new Date(alarm.time);
  
  // 设置今天的闹钟时间
  const todayTrigger = new Date(now);
  todayTrigger.setHours(alarmTime.getHours(), alarmTime.getMinutes(), 0, 0);
  
  // 如果是一次性闹钟
  if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
    return todayTrigger;
  }
  
  // 如果是重复闹钟
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(todayTrigger);
    checkDate.setDate(todayTrigger.getDate() + i);
    const dayOfWeek = checkDate.getDay();
    
    if (alarm.repeatDays.includes(dayOfWeek)) {
      if (i === 0 && checkDate <= now) {
        continue; // 今天已经过了，找下一个
      }
      return checkDate;
    }
  }
  
  return todayTrigger; // 默认返回今天
};