const form = document.getElementById('form');
const submitButton = document.querySelector('.submit-button');
const inputCity = document.getElementById('city');
const inputRange = document.querySelectorAll('.range');
const aside = document.querySelector('aside');
const mainInner = document.querySelector('.main__inner-wrapper');
const resultSection = document.querySelector('.main__section-result');

let limit = 5;
let clickedSearch = 0;
const resultStates = [];

const apiKey = '630dfa7ca50c04e808eb17c37175e416';

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (clickedSearch < 1) {
        const userInputCity = inputCity.value;
        const getInfo = await getCityInfo(userInputCity);
        lat = getInfo[0];
        lon = getInfo[1];
        const checkedRanges = [...inputRange].map(range => range.checked ? range : '').filter(range => range.length !== 0);
        if (checkedRanges.length !== 0) await showResults(checkedRanges[0], userInputCity);
        else wrongInput();
    }
    clickedSearch++;
});

const getCityInfo = async (city) => {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    return [data.coord.lon, data.coord.lat]
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
                else if (inputCity !== '' && document.getElementById('5days').checked) display40DaysWeather(lat, lon);   
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

const display40DaysWeather = async (let, lon) => {
    const daysWeatherObj = await getDaysWeather(let, lon);
    const backButton = document.createElement('button');
    resultSection.style.display = 'none';
    mainInner.style.display = 'none';
    aside.innerHTML = ``;
    for (let i=0; i<Object.keys(daysWeatherObj).length-10; i++) {
        const dayNum = Object.keys(daysWeatherObj)[i];
        const dayCell = document.createElement('div');
        const dayHeader = document.createElement('h5');
        const dayTemp = document.createElement('p');
        const dayFeelsLike = document.createElement('p');
        const dayMinTemp = document.createElement('p');
        const dayMaxTemp = document.createElement('p');

        dayHeader.textContent = `Day ${+dayNum+1}`;
        dayTemp.textContent = `${daysWeatherObj[Object.keys(daysWeatherObj)[i]].main.temp}°C`;
        dayFeelsLike.textContent = `Temp: ${daysWeatherObj[Object.keys(daysWeatherObj)[i]].main['feels_like']}°C`;
        dayMinTemp.textContent = `Min temp: ${daysWeatherObj[Object.keys(daysWeatherObj)[i]].main['temp_min']}°C`;
        dayMaxTemp.textContent = `Max temp: ${daysWeatherObj[Object.keys(daysWeatherObj)[i]].main['temp_max']}°C`;
        dayCell.style.border = '1px solid #000';
        dayCell.style.display = 'flex';
        dayCell.style.justifyContent = 'center';
        dayCell.style.flexDirection = 'column';
        dayCell.appendChild(dayHeader);
        dayCell.appendChild(dayTemp);
        dayCell.appendChild(dayFeelsLike);
        dayCell.appendChild(dayMinTemp);
        dayCell.appendChild(dayMaxTemp);
        aside.appendChild(dayCell);
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
    aside.appendChild(backButton);
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