var five          = require('johnny-five'),
    request       = require('request'),
    board         = new five.Board(),
    loopDelay     = 2000,
    numberRows    = 2,
    numberCols    = 16,
    currentCity   = 'London',
    countryCode   = 'UK',
    requestString = '',
    tempFormat    = 'C',
    temp, 
    tempLow, 
    tempHigh, 
    description;

function kelvinToC ( input ) {
  input -= 273.15;
  return parseInt(input);
}

function kelvinToF ( input ) {
  input = (input - 273.15) * 1.8000 + 32.00;
  return parseInt(input);
}

board.on('ready', function () {

  console.log('Arduino ready');

  var lcd = new five.LCD({
    pins: [12, 11, 5, 4, 3, 2],
    rows: numberRows,
    cols: numberCols
  });

  lcd.on('ready', function () {

    console.log('LCD ready');

    lcd.clear().setCursor(0,0).print("Fetching weather");

    request("http://api.openweathermap.org/data/2.5/weather?q="+currentCity+","+countryCode.toLowerCase()+"", function ( err, response, body ) {

      console.log('Request successful');

      var weatherData = JSON.parse(body),
          conFs;

      if ( ['C', 'F'].indexOf(tempFormat) === -1 ) return console.log('Temp format error', tempFormat);

      conFs = tempFormat === 'C' ? kelvinToC : kelvinToF

      temp      = conFs( weatherData.main.temp );
      tempLow   = conFs( weatherData.main.temp_min );
      tempHigh  = conFs( weatherData.main.temp_max );

      description = weatherData.weather[0].description;

      render();
    });
  });

  function render () {

    var degCharMap      = [4,10,4,0,0,0,0], // Custom degree symbol
        secondLine      = 0,
        numberMessages  = 3;

    lcd.createChar('deg', degCharMap);
    lcd.useChar('deg');
    lcd.clear().setCursor(0,0).print(currentCity);
    lcd.setCursor(numberCols-4, 0).print(temp).setCursor(numberCols-2, 0).print(':deg:');
    lcd.setCursor(numberCols-1, 0).print(tempFormat);

    function _loop () {

      // Wipe 2nd line (fill with empty characters)
      lcd.setCursor(0, numberRows - 1).print( new Array(numberCols).join(' ') );

      switch ( secondLine ) {
        case 0:
          lcd.setCursor(0, numberRows - 1).print(description);
          break;
        case 1:
          lcd.setCursor(0, numberRows - 1).print('High of ' + tempHigh + ':deg:' + tempFormat);
          break;
        case 2:
          lcd.setCursor(0, numberRows - 1).print('Low of ' + tempLow + ':deg:' + tempFormat);
          break;
      }

      secondLine++;

      if ( secondLine >= numberMessages ) secondLine = 0;
    }

    board.loop( loopDelay, _loop );
    _loop(); // First time
  }
});

