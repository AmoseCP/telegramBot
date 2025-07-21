
import 'dotenv/config'

console.log(`==  ==>`,  process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, process.env.OPENWEATHERMAP_APPID);

let config = {
   'interval' : 1, // interval in days (Integer)
   'runNow': true, 
   'time': '23:59:59'
}

function reformatWeatherText(text) {
  // Split the input text into lines
  const lines = text.split('\n');
  // Process each line
  const formattedLines = lines.map(line => {
    // Split the line at the temperature data
    const [dateTimePart, ...weatherParts] = line.split(/\s{2,}/);
    const weatherPart = weatherParts.join('  ');
    // Parse the date and time
    const dateTimeMatch = dateTimePart.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+) (AM|PM)/);
    if (!dateTimeMatch) return line; // Return unchanged if format doesn't match
    const [, month, day, year, hour, , , ampm] = dateTimeMatch;
    // Convert month number to month name
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month) - 1];
    // Format the time (remove leading zero if present)
    const hourNum = parseInt(hour);
    const simpleTime = `${hourNum} ${ampm.toLowerCase()}`;
    // Combine the reformatted parts
    return `${monthName} ${day}, ${simpleTime}    ${weatherPart}`;
  });
  return formattedLines.join('\n');
}

const func = async () => {
  try {
    const appid = process.env.OPENWEATHERMAP_APPID;
    const teleUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&text=`;
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=39.0046&lon=-76.8755&units=metric&lang=zh_cn&appid=${appid}`);
    const data = await response.json();
    const cityName = data.city.name;
    let text = '';
    for (let i = 0; i < data.list.length; i++) {
      let utcTime = new Date();
      let currentUtcTimeStamp = Math.round(utcTime.getTime()/1000);
      let nextForeCastTimeStamp = data.list[i].dt;
      let difHours = (nextForeCastTimeStamp - currentUtcTimeStamp)/3600;
      if (difHours >= 3 && difHours < 21) {
        let theDate = new Date(Date.parse(data.list[i].dt_txt+ ' UTC'));
        let localDate = theDate.toLocaleString();
        let timeLength = localDate.length;
        let temperate = Math.round(data.list[i].main.temp) + ' ℃ ';
        let weatherDescription = data.list[i].weather[0].description;
        if (timeLength === 21) {
                localDate+='  ';
        }
        text = text +reformatWeatherText(localDate + '  ' + temperate + weatherDescription +'%0A');
      }
    }
  
    let res = await fetch(teleUrl + text);
    let data1 = await res.json();
    console.log(data1);
  }catch (error) {
    console.log(error);
  }
}



const weatherForecast = (config, func) => {
        config.runNow && func();
        let nowTime = new Date().getTime();
        let timePoints = config.time.split(':').map(i => parseInt(i));
        let recent = new Date().setHours(...timePoints);
        recent >= nowTime || (recent += 24 * 3600000);
        setTimeout(() => {
                func();
                setInterval(func, config.interval * 24 * 3600000);
        }, recent - nowTime);
}



(function() {
        console.log('开始执行了');
        weatherForecast(config, func);
})();



