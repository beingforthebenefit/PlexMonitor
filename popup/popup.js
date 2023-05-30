// Fetch the Plex URL and token from storage
browser.storage.local.get(['plexUrl', 'plexToken'], function(data) {
    let plexUrl = data.plexUrl;
    let plexToken = data.plexToken;

    // Fetch the total number of movies
    fetchMovies(plexUrl, plexToken);

    // Fetch the total number of TV shows
    fetchTvShows(plexUrl, plexToken);

    // Fetch the current streams
    fetchStreams(plexUrl, plexToken);

    // Fetch the current Plex activities
    fetchActivities(plexUrl, plexToken);
});

function fetchMovies(plexUrl, plexToken) {
    console.log('Fetch URL', plexUrl + '/library/sections/1/all?X-Plex-Token=' + plexToken)
    fetch(plexUrl + '/library/sections/1/all?X-Plex-Token=' + plexToken)
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            let movieCount = data.getElementsByTagName('Video').length;
            document.getElementById('movieCount').textContent = 'Total movies: ' + movieCount;
        });
}

function fetchTvShows(plexUrl, plexToken) {
    // Assuming section ID 2 for TV Shows
    fetch(plexUrl + '/library/sections/2/all?X-Plex-Token=' + plexToken)
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            let tvShowCount = data.getElementsByTagName('Directory').length;
            document.getElementById('tvShowCount').textContent = 'Total TV shows: ' + tvShowCount;
        });
}

function fetchStreams(plexUrl, plexToken) {
    fetch(plexUrl + '/status/sessions?X-Plex-Token=' + plexToken)
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            let streamList = document.getElementById('streamList');
            let videos = data.getElementsByTagName('Video');
            for(let i = 0; i < videos.length; i++) {
                let title = videos[i].getAttribute('title');
                let listItem = document.createElement('li');
                listItem.textContent = title;
                streamList.appendChild(listItem);
            }
        });
}

function fetchActivities(plexUrl, plexToken) {
    const url = `${serverUrl}/activities?X-Plex-Token=${plexToken}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data,"text/xml");

            let activities = xmlDoc.getElementsByTagName('Activity');
            let activityList = document.getElementById('activityList');

            // clear out any existing children of the activityList div
            while (activityList.firstChild) {
                activityList.removeChild(activityList.firstChild);
            }

            for (let activity of activities) {
                let uuid = activity.getAttribute('uuid');
                let type = activity.getAttribute('type');
                let cancellable = activity.getAttribute('cancellable');
                let userID = activity.getAttribute('userID');
                let title = activity.getAttribute('title');
                let subtitle = activity.getAttribute('subtitle');
                let progress = activity.getAttribute('progress');

                // create an HTML element for this activity
                let activityElement = document.createElement('div');
                activityElement.className = 'activity';

                // create HTML elements for each piece of activity data and append them to the activity element
                activityElement.innerHTML = `
                    <p>Activity UUID: ${uuid}</p>
                    <p>Type: ${type}</p>
                    <p>Cancellable: ${cancellable}</p>
                    <p>User ID: ${userID}</p>
                    <p>Title: ${title}</p>
                    <p>Subtitle: ${subtitle}</p>
                    <p>Progress: ${progress}%</p>
                `;

                // append the activity element to the activity list
                activityList.appendChild(activityElement);
            }
        })
        .catch(error => console.error('Error:', error));
}

