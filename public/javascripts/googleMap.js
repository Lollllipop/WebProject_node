var marker;

function initMap() {
  var myLatlng = {lat: 37.580213, lng: 126.923442}; // 기본 위치
  map = new google.maps.Map(document.getElementById('map'), { // 지도
    zoom: 11,
    center: myLatlng
  });

  marker = new google.maps.Marker({ // 마커
    position: myLatlng,
    map: map
  });

  geocoder = new google.maps.Geocoder;

  google.maps.event.addListener(map, 'click', function(event){ // 맵 click event handler
    console.log(event.latLng);
    var location2 = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    console.log(location2);
    placeMarker(event.latLng); // event.latLng가 클릭 지점의 위도 경도를 받음
  });
}

function placeMarker(location) { // 마커 그리기
  marker.setMap(null); // 이전 마커 삭제
  marker = new google.maps.Marker({position: location, map: map});
  address=location;
  geocodeLatLng(geocoder, map, infowindow, marker, location);
  marker.addListener('click', function() {
    map.setCenter(marker.getPosition());
  });
}

function geocodeLatLng(geocoder, map, infowindow, marker, _latlng) {
  var input = _latlng;
  console.log(input);
  var latlngStr = input.split(',', 2);
  var latlng = {lat: parseFloat(latlngStr[0]), lng: parseFloat(latlngStr[1])};
  geocoder.geocode({'location': latlng}, function(results, status) {
    if (status === 'OK') {
      if (results[1]) {
        infowindow.setContent(results[1].formatted_address);
        infowindow.open(map, marker);
      } else {
        window.alert('No results found');
      }
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}