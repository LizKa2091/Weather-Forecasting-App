const form = document.getElementById('form');
const submitButton = document.querySelector('.submit-button');
const inputCity = document.getElementById('city');
const inputRange = document.querySelectorAll('.range');
const aside = document.querySelector('aside');
const mainInner = document.querySelector('.main__inner-wrapper');
const resultSection = document.querySelector('.main__section-result');

let limit = 10;
let clickedSearch = 0;
const resultStates = [];

const apiKey = '630dfa7ca50c04e808eb17c37175e416';

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultSection.textContent = '';
    if (clickedSearch < 1) {
        const userInputCity = inputCity.value;
        if (userInputCity === '') {
            clickedSearch = 0;
            return;
        }
        else if (!document.getElementById('5days').checked && !document.getElementById('curr').checked) {
            clickedSearch = 0;
            return;
        }
        const getInfo = await getCityInfo(userInputCity);
        resultSection.textContent = '';
        lat = getInfo[0];
        lon = getInfo[1];
        const checkedRanges = [...inputRange].map(range => range.checked ? range : '').filter(range => range.length !== 0);
        if (checkedRanges.length !== 0) await showResults(checkedRanges[0], userInputCity);
        else wrongInput();
    }
    clickedSearch++;
});

const getCityInfo = async (city) => {
    resultSection.textContent = 'Loading...';
    let response;
    try {
        response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    }
    catch(err) {
        resultSection.textContent = 'Failed to fetch city data. Try again in a few minutes';
        clickedSearch = 0;
        throw new Error(`failed to fetch city data`);
    }
    const data = await response.json();
    return [data.coord.lon, data.coord.lat];
};

const processFormat = async (range, city) => {
    let getCityUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=${limit}&appid=${apiKey}`;
    const resultObj = {};
    await fetch(getCityUrl)
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        data.forEach((item) => {
            resultStates.push(item.state);
            resultObj[item.state] = {
                'lat': item['lat'],
                'lon': item['lon']
            };
        });
    })
    .catch(rejected => {
        console.log(rejected);
    });
    return resultObj;
};

const wrongInput = () => {
    if (resultSection.innerHTML === '') {
        const wrongInputP = document.createElement('p');
        wrongInputP.textContent = 'Wrong input';
        resultSection.appendChild(wrongInputP);
        const timeOut = setTimeout(() => {
            resultSection.innerHTML = ``;
            clickedSearch = 0;
        }, 3000);
    }
};

const showResults = async (range, city) => {
    const newObj = await processFormat(range, city);

    if (resultStates.length === 0) {
        resultSection.textContent = `Failed to find your city: ${city}. Try another city`;
        setTimeout(() => {
            resultSection.textContent = '';
            clickedSearch = 0;
        }, 5000);
    }
    else {
        const labelResult = document.createElement('label');
        labelResult.textContent = 'Please choose state:';
        const formResult = document.createElement('form');
        formResult.appendChild(labelResult);
        resultSection.appendChild(formResult);
        resultStates.forEach(state => {
            const resultStateRadio = document.createElement('input');
            resultStateRadio.setAttribute('type', 'radio');
            resultStateRadio.setAttribute('id', `${state}`);
            resultStateRadio.setAttribute('name', 'state');
            resultStateRadio.setAttribute('value', `${state}`);
            resultStateRadio.style.marginLeft = '15px';
            resultStateRadio.classList.add('result-radio');

            const resultStateLabel = document.createElement('label');
            resultStateLabel.textContent = `${state}`;
            resultStateLabel.setAttribute('for', `${state}`);
            formResult.appendChild(resultStateRadio);
            formResult.appendChild(resultStateLabel);
        });
        let resultRadios = document.querySelectorAll('.result-radio');
        [...resultRadios].forEach((inp) => {
            inp.addEventListener('click', (e)=>{
                let chosenState = e.target.value;
                lat = newObj[`${chosenState}`]['lat'];
                lon = newObj[`${chosenState}`]['lon'];
                if (inputCity !== '' && document.getElementById('curr').checked) displayCurrWeather(lat, lon);
                else if (inputCity !== '' && document.getElementById('5days').checked) display5DaysWeather(lat, lon);   
            });
        });
    }
};

const getDaysWeather = async (lat, lon) => {
    const requestDaysWeather = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    let outp = {};
    await fetch(requestDaysWeather)
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        outp = data['list'];
    })
    return outp;
};

const display5DaysWeather = async (let, lon) => {
    const daysWeatherObj = await getDaysWeather(let, lon);
    const backButton = document.createElement('button');
    const backButtonDiv = document.createElement('div');
    const todayWeekCount = new Date().getDay();
    const numToDay = {0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'};
    let dayCount = 0;

    resultSection.style.display = 'none';
    mainInner.style.display = 'none';
    aside.innerHTML = ``;
    const dayCellsDiv = document.createElement('div');
    dayCellsDiv.classList.add('day-cells-div');
    
    for (let i=0; i<Object.keys(daysWeatherObj).length; i++) {
        let dateNum = (todayWeekCount + dayCount) % 7;
        let currentNum = (todayWeekCount + Math.floor(i / 8)) % 7;
        let currentDay = numToDay[currentNum];
        let time = i*3;
        while (time >= 24) {
            time -= 24;
        }
        let hours = `${time<10 ? `0${time}` : time}`;

        const dayCell = document.createElement('div');
        const dayHeader = document.createElement('h5');
        const dayTime = document.createElement('p');
        const dayTemp = document.createElement('p');
        const dayFeelsLike = document.createElement('p');

        dayHeader.textContent = `${currentDay}, ${dateNum}`;
        dayTime.textContent = `${hours}:00`;
        dayTemp.textContent = `Temp: ${daysWeatherObj[Object.keys(daysWeatherObj)[i]].main.temp}°C`;
        dayFeelsLike.textContent = `Feels like: ${daysWeatherObj[Object.keys(daysWeatherObj)[i]].main['feels_like']}°C`;
        dayCell.classList.add('day-cell');
        dayCell.style.border = '1px solid #000';
        dayCell.style.display = 'flex';
        dayCell.style.justifyContent = 'center';
        dayCell.style.flexDirection = 'column';

        dayCell.appendChild(dayHeader);
        dayCell.appendChild(dayTime);
        dayCell.appendChild(dayTemp);
        dayCell.appendChild(dayFeelsLike);
        dayCellsDiv.appendChild(dayCell);
        if (time >= 24) dayCount++;
    }
    backButton.textContent = 'Back';
    backButton.addEventListener('click', ()=>{
        resultSection.style.display = 'flex';
        mainInner.style.display = 'block';
        [...document.querySelectorAll('form')].forEach((form) => form.reset());
        clickedSearch = 0;
        resultSection.innerHTML = ``;
        aside.innerHTML = ``;
        resultStates.length = 0;
    });
    backButton.style.width = '75%';
    backButton.style.height = '125%';
    dayCellsDiv.style.display = 'grid';
    dayCellsDiv.style.gridTemplateRows = 'repeat(5, 1fr)';
    dayCellsDiv.style.gridTemplateColumns = 'repeat(8, 1fr)';
    dayCellsDiv.style.gap = '5px';
    backButtonDiv.style.display = 'flex';
    backButtonDiv.style.justifyContent = 'center';
    aside.appendChild(dayCellsDiv);
    aside.appendChild(backButtonDiv);
    backButtonDiv.appendChild(backButton);
};

const getCurrWeather = async (lat, lon) => {
    const urlCurrentWeather = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const currWeatherObj = {};
    await fetch(urlCurrentWeather)
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        currWeatherObj['feelsLike'] = data.main.feels_like;
        currWeatherObj['temp'] = data.main.temp;
        currWeatherObj['maxTemp'] = data.main.temp_max;
        currWeatherObj['minTemp'] = data.main.temp_min;
        currWeatherObj['windSpeed'] = data.wind.speed;
    });
    return currWeatherObj;
};

const displayCurrWeather = async (lat, lon) => {
    submitButton.style.display = 'none';
    const currWeatherObj = await getCurrWeather(lat, lon);
    const currWeatherDiv = document.createElement('div');
    currWeatherDiv.style.display = 'flex';
    currWeatherDiv.style.justifyContent = 'center';
    currWeatherDiv.style.flexDirection = 'column';

    const temp = document.createElement('p');
    temp.textContent = `Temperature: ${currWeatherObj['temp']}°C`;
    currWeatherDiv.appendChild(temp);

    const feelsLikeP = document.createElement('p');
    feelsLikeP.textContent = `Feels like: ${currWeatherObj['feelsLike']}°C`;
    currWeatherDiv.appendChild(feelsLikeP);

    const minTemp = document.createElement('p');
    minTemp.textContent = `Min temperature: ${currWeatherObj['minTemp']}°C`;
    currWeatherDiv.appendChild(minTemp);

    const maxTemp = document.createElement('p');
    maxTemp.textContent = `Max temperature: ${currWeatherObj['maxTemp']}°C`;
    currWeatherDiv.appendChild(maxTemp);

    const windSpeed = document.createElement('p');
    windSpeed.textContent = `Wind speed: ${currWeatherObj['windSpeed']}`;
    currWeatherDiv.appendChild(windSpeed);

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.addEventListener('click', ()=>{
        [...document.querySelectorAll('form')].forEach((form) => form.reset());
        clickedSearch = 0;
        resultSection.innerHTML = '';
        resultStates.length = 0;
        submitButton.style.display = 'block';
    });
    resultSection.appendChild(currWeatherDiv);
    currWeatherDiv.appendChild(backButton);
    document.querySelector('.main__section-result form').innerHTML = ``;
};