// Fetch the Plex URL and token from storage
browser.storage.local.get(['plexUrl', 'plexToken', 'movieCount', 'tvShowCount', 'moviesLibraryId', 'tvShowsLibraryId'], function (data) {
    let plexUrl = data.plexUrl;
    let plexToken = data.plexToken;
    let moviesLibraryId = data.moviesLibraryId
    let tvShowsLibraryId = data.tvShowsLibraryId

    if (data.movieCount !== undefined) {
        document.getElementById('movieCount').textContent = `${data.movieCount} (refreshing...)`;
    }

    if (data.tvShowCount !== undefined) {
        document.getElementById('tvShowCount').textContent = `${data.tvShowCount} (refreshing...)`;
    }

    // Fetch the total number of movies
    fetchMovies(plexUrl, plexToken, moviesLibraryId);

    // Fetch the total number of TV shows
    fetchTVShows(plexUrl, plexToken, tvShowsLibraryId);

    // Fetch the current streams
    fetchStreams(plexUrl, plexToken);

    // Fetch the current Plex activities
    fetchActivities(plexUrl, plexToken);
});

function fetchMovies(serverUrl, plexToken, moviesLibraryId) {
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

function fetchTVShows(serverUrl, plexToken, tvShowsLibraryId) {
    const url = `${serverUrl}/library/sections/${tvShowsLibraryId}/all?X-Plex-Token=${plexToken}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data, "text/xml");

            let tvShows = xmlDoc.getElementsByTagName("Directory");
            let tvShowCount = tvShows.length;

            let episodeCount = 0;

            // Iterate through each TV show
            for (let i = 0; i < tvShows.length; i++) {
                let tvShow = tvShows[i];
                let tvShowSeasonId = tvShow.getAttribute('ratingKey');

                // Fetch the metadata for the TV show season
                let seasonUrl = `${serverUrl}/library/metadata/${tvShowSeasonId}/children?X-Plex-Token=${plexToken}&X-Plex-Container-Start=0&X-Plex-Container-Size=0`;
                fetch(seasonUrl)
                    .then(response => response.text())
                    .then(data => {
                        let seasonXmlDoc = parser.parseFromString(data, "text/xml");
                        let episodes = seasonXmlDoc.getElementsByTagName("Video");
                        episodeCount += episodes.length;

                        // Update the episode count on the UI
                        let tvShowElement = document.getElementById('tvShowCount');
                        tvShowElement.textContent = `${tvShowCount} TV Shows (${episodeCount} episodes)`;
                    })
                    .catch(error => console.error('Error fetching season data:', error));
            }

            // Update the TV show count on the UI
            let tvShowElement = document.getElementById('tvShowCount');
            tvShowElement.textContent = `${tvShowCount} TV Shows`;
        })
        .catch(error => console.error('Error fetching TV shows:', error));
}


function fetchStreams(serverUrl, plexToken) {
    const url = `${serverUrl}/status/sessions?X-Plex-Token=${plexToken}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data, "text/xml");

            let videos = xmlDoc.getElementsByTagName("Video");

            let streamList = document.getElementById('streamList');

            // clear out any existing children of the streamList div
            while (streamList.firstChild) {
                streamList.removeChild(streamList.firstChild);
            }

            if (videos.length === 0) {
                // No streams, show a message
                streamList.textContent = 'No current streams';
            } else {
                // Create a table
                let streamTable = document.createElement('table');
                streamList.appendChild(streamTable);

                // Create table header
                let headers = ['User', 'Movie', 'Resolution', 'Device', 'State', 'Progress'];
                let thead = streamTable.createTHead();
                let headerRow = thead.insertRow();
                for (let header of headers) {
                    let th = document.createElement('th');
                    th.textContent = header;
                    headerRow.appendChild(th);
                }

                // Populate the table with rows for each video stream
                for (let i = 0; i < videos.length; i++) {
                    let video = videos[i];

                    let user = video.getElementsByTagName("User")[0];
                    let player = video.getElementsByTagName("Player")[0];

                    let userName = user.getAttribute('title');
                    let movieTitle = video.getAttribute('title');
                    let movieDuration = video.getAttribute('duration');
                    let progress = video.getAttribute('viewOffset');

                    let streamResolution;
                    let media = video.getElementsByTagName("Media")[0];
                    if (media) {
                        streamResolution = media.getAttribute('videoResolution');
                    }

                    let playerDevice = player.getAttribute('device');
                    let streamState = player.getAttribute('state');

                    // create a new row for this stream
                    let row = streamTable.insertRow();
                    let cell;

                    cell = row.insertCell();
                    cell.textContent = userName;

                    cell = row.insertCell();
                    cell.textContent = movieTitle;

                    cell = row.insertCell();
                    cell.textContent = streamResolution;

                    cell = row.insertCell();
                    cell.textContent = playerDevice;

                    cell = row.insertCell();
                    cell.textContent = streamState;

                    cell = row.insertCell();
                    cell.textContent = `${(progress / movieDuration * 100).toFixed(2)}%`;
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
                // Create a table
                let activityTable = document.createElement('table');
                activityList.appendChild(activityTable);

                // Create table header
                let headers = ['UUID', 'Type', 'Cancellable', 'User ID', 'Title', 'Subtitle', 'Progress'];
                let thead = activityTable.createTHead();
                let headerRow = thead.insertRow();
                for (let header of headers) {
                    let th = document.createElement('th');
                    th.textContent = header;
                    headerRow.appendChild(th);
                }

                // Populate the table with rows for each activity
                for (let activity of activities) {
                    let uuid = activity.getAttribute('uuid');
                    let type = activity.getAttribute('type');
                    let cancellable = activity.getAttribute('cancellable');
                    let userID = activity.getAttribute('userID');
                    let title = activity.getAttribute('title');
                    let subtitle = activity.getAttribute('subtitle');
                    let progress = activity.getAttribute('progress');

                    // create a new row for this activity
                    let row = activityTable.insertRow();
                    let cell;

                    cell = row.insertCell();
                    cell.textContent = uuid;

                    cell = row.insertCell();
                    cell.textContent = type;

                    cell = row.insertCell();
                    cell.textContent = cancellable;

                    cell = row.insertCell();
                    cell.textContent = userID;

                    cell = row.insertCell();
                    cell.textContent = title;

                    cell = row.insertCell();
                    cell.textContent = subtitle;

                    cell = row.insertCell();
                    cell.textContent = `${progress}%`;
                }
            }
        })
        .catch(error => console.error('Error:', error));
}