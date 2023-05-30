// Fetch the Plex URL and token from storage
browser.storage.local.get(['plexUrl', 'plexToken', 'movieCount', 'tvShowCount'], function (data) {
    let plexUrl = data.plexUrl;
    let plexToken = data.plexToken;

    if (data.movieCount !== undefined) {
        document.getElementById('movieCount').textContent = `${data.movieCount} (refreshing...)`;
    }

    if (data.tvShowCount !== undefined) {
        document.getElementById('tvShowCount').textContent = `${data.tvShowCount} (refreshing...)`;
    }

    // Fetch the total number of movies
    fetchMovies(plexUrl, plexToken);

    // Fetch the total number of TV shows
    fetchTVShows(plexUrl, plexToken);

    // Fetch the current streams
    fetchStreams(plexUrl, plexToken);

    // Fetch the current Plex activities
    fetchActivities(plexUrl, plexToken);
});

function fetchMovies(serverUrl, plexToken) {
    // Get the library ID for Movies
    let moviesLibraryId = 1

    const url = `${serverUrl}/library/sections/${moviesLibraryId}/all?X-Plex-Token=${plexToken}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data, "text/xml");

            let movieCount = xmlDoc.getElementsByTagName('Video').length;

            // Store the movie count in local storage
            browser.storage.local.set({ movieCount });

            // Update the UI
            document.getElementById('movieCount').textContent = `${movieCount}`;
        })
        .catch(error => console.error('Error:', error));
}

function fetchTVShows(serverUrl, plexToken) {
    // Get the library ID for TV Shows
    let tvShowsLibraryId = 2

    const url = `${serverUrl}/library/sections/${tvShowsLibraryId}/all?X-Plex-Token=${plexToken}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data, "text/xml");

            let tvShowCount = xmlDoc.getElementsByTagName('Video').length;

            // Store the TV show count in local storage
            browser.storage.local.set({ tvShowCount });

            // Update the UI
            document.getElementById('tvShowCount').textContent = `${tvShowCount}`;
        })
        .catch(error => console.error('Error:', error));
}

function fetchStreams(serverUrl, plexToken) {
    const url = `${serverUrl}/status/sessions?X-Plex-Token=${plexToken}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data, "text/xml");

            let streams = xmlDoc.getElementsByTagName('Stream');

            let streamList = document.getElementById('streamList');

            // clear out any existing children of the streamList div
            while (streamList.firstChild) {
                streamList.removeChild(streamList.firstChild);
            }

            if (streams.length === 0) {
                // No streams, show a message
                streamList.textContent = 'No current streams';
            } else {
                // Populate the stream list
                for (let stream of streams) {
                    let streamElement = document.createElement('div');
                    streamElement.className = 'stream';

                    // populate streamElement with stream data...
                    let id = stream.getAttribute('id');
                    let title = stream.getAttribute('title');
                    let type = stream.getAttribute('type');

                    streamElement.textContent = `ID: ${id}, Title: ${title}, Type: ${type}`;

                    streamList.appendChild(streamElement);
                }
            }
        })
        .catch(error => console.error('Error:', error));
}



function fetchActivities(serverUrl, plexToken) {
    const url = `${serverUrl}/activities?X-Plex-Token=${plexToken}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data, "text/xml");

            let activities = xmlDoc.getElementsByTagName('Activity');
            let activityList = document.getElementById('activityList');

            // clear out any existing children of the activityList div
            while (activityList.firstChild) {
                activityList.removeChild(activityList.firstChild);
            }

            if (activities.length === 0) {
                // No activities, show a message
                activityList.textContent = 'No current activities';
            } else {
                // Populate the activity list
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

                    activityList.appendChild(activityElement);
                }
            }
        })
        .catch(error => console.error('Error:', error));
}