const axios = require('axios');

const googleApiKey = process.env.GOOGLE_API_KEY;
const nasaApiKey = process.env.NASA_API_KEY;

async function getIssLocation() {
  try {
    const response = await axios.get('http://api.open-notify.org/iss-now.json');
    return response.data.iss_position;
  } catch (err) {
    return false;
  }
}

async function getIssCrew() {
  try {
    const response = await axios.get('http://api.open-notify.org/astros.json');
    return response.data.people.map((person) => person.name);
  } catch (err) {
    return [];
  }
}

async function getIssImageryUrl(lat, long) {
  try {
    const response = await axios.get(`https://api.nasa.gov/planetary/earth/imagery/?lon=${long}&lat=${lat}&date=2017-01-01&cloud_score=True&api_key=${nasaApiKey}`);
    return response.data.url;
  } catch (err) {
    return 'https://placekitten.com/640/360';
  }
}

async function reverseGeocode(lat, long) {

  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${googleApiKey}`);
    console.log(response.data.results[0]);
    if (response.data.results && response.data.results[0] && response.data.results[0].formatted_address)
      return response.data.results[0].formatted_address;
    return 'Unknown';
  } catch (err) {
    return 'Unknown';
  }

}

async function getMapsUrl(lat, long) {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${long}&zoom=3&size=600x600&maptype=hybrid&&key=${googleApiKey}&markers=color:red%7Clabel:I%7C${lat},${long}`;
}

module.exports.handler = async (event, context, callback) => {
  try {
    const issPosition = await getIssLocation();
    const crewMembers = await getIssCrew();

    const rGeoCode = await reverseGeocode(issPosition.latitude, issPosition.longitude);
    const imagery = await getIssImageryUrl(issPosition.latitude, issPosition.longitude);
    const map = await getMapsUrl(issPosition.latitude, issPosition.longitude);

    return {
      statusCode: 200,
      body: `
      <html>
      <head>
      <title>HTML from API Gateway/Lambda</title>
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
      </head>
      <body>
      <h1>The ISS is currently over ${rGeoCode}</h1>
      <strong>On board:</strong> ${crewMembers.join(', ')}
       <hr>
      <img src='${map}'/> <hr>
      <h2>This is what is right below it</h2>
      <img src='${imagery}'/>
      </body></html>`
    };
  } catch (err) {
    return callback(err);
  }
};
