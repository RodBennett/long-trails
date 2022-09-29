//query selector variables go here 👇
let searchInput = document.getElementById("search-input"); //USED FOR AUTOCOMPLETE & SEARCH BAR RESULTS

//global variables go here 👇

//event listeners go here 👇
window.addEventListener('resize', () => {
  console.log(window.innerWidth);
  window.innerWidth > 500 ? initMap(4) : initMap(3);
});
searchInput.addEventListener("keypress", async (event) => {
  // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
    event.preventDefault();
    let rawCampsites = await getList(); // get camp data from database
    let getState = rawCampsites.filter(camp => camp.nameState === searchInput.value); //get state for current search input
    console.log(getState);

    let selectedCampLat;
    let selectedCampLng;

    if (getState.length) { //get lat & lng for selected campsite to render blue marker
      selectedCampLat = getState[0].lat;
      selectedCampLng = getState[0].lng;
    }

    if (!getState.length) {getState = rawCampsites.filter(camp => camp.zipCode === searchInput.value)}; // if input is a zipcode get state
    let state = getState[0].state; // get state for first location in the array
    initMap(6, state, selectedCampLat, selectedCampLng); // render map by passing state, map zoom level, selected camp lat & lng
  }
});
searchInput.addEventListener("input", () => searchAutoComplete());
searchInput.addEventListener("input", () => console.log(searchInput.value));

//functions and event handlers go here 👇
function logToTerminal() {
  console.log('yes');
  let b = document.getElementById('gmimap3')
  // b.setAttribute('style', "color:green!important");
  // b.setIcon('http://www.google.com/mapfiles/shadow50.png');
  // "markers[ID].setIcon(image_url)">
  b.setIcon("http://maps.google.com/mapfiles/ms/icons/blue-dot.png")
  console.log(b)
}

// RENDER SEARCH RESULTS IN ASIDE
function renderSearchResults(list) {
  console.log('list ======= ', list);
  let asideContainer = document.getElementById('searchResults');
  asideContainer.textContent = "";

  for (let i = 0; i < list.length; i++) {
    //CREATE ELEMENT
    let campPath = document.createElement('a');
    let campName = document.createElement('p');
    let renderLine = document.createElement('hr');

    // campPath.addEventListener('mouseover', logToTerminal);

    //SET ATTRIBUTES
    campPath.setAttribute('href', `/api/map/campsite/:${list[i].camp_id}`);

    //CREATE TITLE CONTENT
    campName.textContent = `${i + 1}) ${list[i].nameState }`;

    //APPEND
    asideContainer.append(campPath);
    campPath.append(campName);
    campName.append(renderLine);
  }
};

async function initMap(zoomLevel, state, selectedCampLat, selectedCampLng) {
  let list = await getList(state);

  let centerLat;
  let centerLng;

  selectedCampLat ? centerLat = selectedCampLat : centerLat = list[0].lat;
  selectedCampLng ? centerLng = selectedCampLng : centerLng = list[0].lng;

  console.log(zoomLevel, list[0].lat, list[0].lng )
  console.log(selectedCampLat, selectedCampLng, centerLat, centerLng);

  var w = window.innerWidth;
  var h = window.innerHeight; 

  if (window.innerWidth <= 500 && !zoomLevel) {
    zoomLevel = 3;
  }

  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: centerLat, lng: centerLng },
    zoom: zoomLevel || 4,
    mapTypeId: 'terrain',
    // disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: true,
    fullscreenControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
    },
    qenableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  });

  // Create an info window to share between markers.
  const infoWindow = new google.maps.InfoWindow();

  // Create the marker
  const markers = list.map(({ lat, lng, name, id, camp_id }, i) => {

    if(lat && lng) {
    
      const contentString = `<h6 id="" class="" style="color: blue; text-decoration: underline"><a href="/api/map/campsite/:${camp_id}">${name}</a></h6>`

      // https://maps.gstatic.com/mapfiles/place_api/icons/v2/camping_pinlet.svg
      let selectedCampsiteIcon = "http://maps.google.com/mapfiles/kml/shapes/campground.png";
      let campsiteIcon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        optimized: true,
        icon: lat === selectedCampLat ? selectedCampsiteIcon : campsiteIcon,
        size: new google.maps.Size(50, 100),
      });

      // Add a click listener for each marker, and set up the info window.

      marker.addListener('click', () => {
        infoWindow.close();
        infoWindow.setContent(contentString);
        infoWindow.open(marker.getMap(), marker);
        if (lat !== selectedCampLat) {
          marker.setIcon("http://maps.google.com/mapfiles/ms/icons/blue-dot.png")
        }
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          marker.setAnimation(null);
        }, 1000);
      });
      return marker;
    }
  });

  console.log(markers);
  renderSelectedCampMarker(selectedCampLat, infoWindow, map);
  renderMarkerClusters( markers, map);
  renderSearchResults(list);
  renderCurrentLocationIcon(map, infoWindow);
}

// CREATES A MARKER FOR SELECTED CAMPSITE
function renderSelectedCampMarker(selectedCampLat, infoWindow, map) {
  if (selectedCampLat && map) {
    const markerSelectedCampsite = new google.maps.Marker({});
    infoWindow.open(markerSelectedCampsite.getMap(), markerSelectedCampsite);
  }
};

// ADD MARKER CLUSTERS TO REDUCE VISUAL CLUTTER
function renderMarkerClusters( markers, map) {
  if (window.innerWidth <= 500) {
    new markerClusterer.MarkerClusterer({ markers, map });
    // new MarkerClusterer({ markers, map });
    // markerCluster.clearMarkers();
    // markerCluster.removeMarker(markers[i]);
  }
}

// RENDER CURRENT LOCATION ICON ON CLICK
function renderCurrentLocationIcon(map, infoWindow) {
  const location = document.createElement('div');
  const locationIcon = document.createElement("img");
  locationIcon.src = '/images/current-location-v4.png';
  location.setAttribute('style', "width:40px; padding: 0px")
  locationIcon.setAttribute('style', "padding-top: 6px; height:33px; width:40px; top:50px")

  location.append(locationIcon);

  location.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(location); 

  locationIcon.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          infoWindow.setPosition(pos);
          infoWindow.setContent("Location found.");
          infoWindow.open(map);
          map.setCenter(pos);
          map.setZoom(5);
          
          
          const markerCurrentLocation = new google.maps.Marker({
            position: pos,
            map,
            icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
          });
          infoWindow.open(markerCurrentLocation.getMap(), markerCurrentLocation);

        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });
}

// HANDLE ERROR FOR CURRENT LOCATION CLICK IF GEO LOCATION DISABLED
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

async function searchAutoComplete() {
  let rawCampsites = await getList();
  let campsites = rawCampsites.map(rawCampsites => rawCampsites.nameState);
  let campZipCodes = rawCampsites.map(rawCampsites => rawCampsites.zipCode)
  .filter(zipCode => zipCode !== null).sort();
  let combineLists = campZipCodes.concat(campsites);
  let autoCompleteList = [...new Set(combineLists)]; // remove duplicates

  $( "#search-input" ).autocomplete({
    minLength: 2,
    source: autoCompleteList,
  });
}

const getList = async (state) => {
  console.log(state)

  let result;

  if (!state) {
    result = await fetch(`/api/map/campsites-all`, {
      method: 'GET',
    });
    const json = await result.json();
    const list = json.filter(element => element.lat !== null || element.lng !== null);
    return list;

  } else {
    result = await fetch(`/api/map/campsite-list/${state}`, {
      method: 'GET',
    });
    const json = await result.json();
    const list = json.filter(element => element.lat !== null || element.lng !== null);
    return list;
  }
};

// Source:
// SIMPLE MARKER: https://developers.google.com/maps/documentation/javascript/examples/marker-simple
// https://developers.google.com/maps/documentation/javascript/examples/marker-accessibility
// INFO WINDOWS: https://developers.google.com/maps/documentation/javascript/examples/infowindow-simple

//TODO
// ADD GEO LOCATION
// ADD LINK TO ROUTE FOR EACH SITE
// WHAT ELSE?
// MAP ICON

// const svgMarker = {
//   path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
//   fillColor: "blue",
//   fillOpacity: 0.6,
//   strokeWeight: 0,
//   rotation: 0,
//   scale: 1,
//   anchor: new google.maps.Point(15, 30),
// };
