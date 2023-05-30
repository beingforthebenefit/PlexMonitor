// Fetch the Plex URL and token from storage
loadData();

function loadData() {
    browser.storage.local.get(['plexUrl', 'plexToken', 'movieCount', 'tvShowCount', 'episodeCount', 'moviesLibraryId', 'tvShowsLibraryId'], function (data) {
        let plexUrl = data.plexUrl;
        let plexToken = data.plexToken;
        let moviesLibraryId = data.moviesLibraryId
        let tvShowsLibraryId = data.tvShowsLibraryId
    
        if (data.movieCount !== undefined) {
            document.getElementById('movieCount').textContent = `${data.movieCount} (refreshing...)`;
        }
    
        if (data.tvShowCount !== undefined) {
            document.getElementById('tvShowCount').textContent = `${data.tvShowCount} TV Shows (${data.episodeCount} episodes) (refreshing...)`;
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
}

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
            let promises = [];

            // Iterate through each TV show
            for (let i = 0; i < tvShows.length; i++) {
                let tvShow = tvShows[i];
                let tvShowSeasonId = tvShow.getAttribute('ratingKey');

                // Fetch the metadata for the TV show season
                let seasonUrl = `${serverUrl}/library/metadata/${tvShowSeasonId}/children?X-Plex-Token=${plexToken}&X-Plex-Container-Start=0&X-Plex-Container-Size=0`;
                let promise = fetch(seasonUrl)
                    .then(response => response.text())
                    .then(data => {
                        let seasonXmlDoc = parser.parseFromString(data, "text/xml");
                        console.log('seasonXML', seasonXmlDoc)
                        let episodes = seasonXmlDoc.getElementsByTagName("MediaContainer");
                        episodeCount += Number(episodes[0].getAttribute('totalSize'));
                    })
                    .catch(error => console.error('Error fetching season data:', error));

                promises.push(promise);
            }

            // Wait for all promises to resolve
            Promise.all(promises)
                .then(() => {
                    // Update the episode count on the UI
                    let tvShowElement = document.getElementById('tvShowCount');

                    // Store TV Show count and episode count in local storage
                    browser.storage.local.set({ tvShowCount, episodeCount });

                    tvShowElement.textContent = `${tvShowCount} TV Shows (${episodeCount} episodes)`;
                })
                .catch(error => console.error('Error:', error));
        })
        .catch(error => console.error('Error fetching TV shows:', error));
}

/// Populate the current streams table for movies
function populateMoviesTable(movies) {
    let moviesTable = document.getElementById('moviesTable');

    // Clear out any existing rows
    moviesTable.innerHTML = '';

    // Create table headers for movies
    let movieTableHeaders = ['User', 'Movie', 'Resolution', 'Device', 'State', 'Progress'];
    let movieTableHeaderRow = document.createElement('tr');

    for (let header of movieTableHeaders) {
        let th = document.createElement('th');
        th.textContent = header;
        movieTableHeaderRow.appendChild(th);
    }

    moviesTable.appendChild(movieTableHeaderRow);

    // Populate movie stream data
    for (let movie of movies) {
        let tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${movie.user}</td>
        <td>${movie.title}</td>
        <td>${movie.resolution}</td>
        <td>${movie.device}</td>
        <td>${movie.state}</td>
        <td>${movie.progress}</td>
      `;
        moviesTable.appendChild(tr);
    }
}

// Populate the current streams table for TV shows
function populateTVShowsTable(tvShows) {
    let tvShowsTable = document.getElementById('tvShowsTable');

    // Clear out any existing rows
    tvShowsTable.innerHTML = '';

    // Create table headers for TV shows
    let tvShowTableHeaders = ['User', 'TV Show', 'Season', 'Episode', 'Resolution', 'Device', 'State', 'Progress'];
    let tvShowTableHeaderRow = document.createElement('tr');

    for (let header of tvShowTableHeaders) {
        let th = document.createElement('th');
        th.textContent = header;
        tvShowTableHeaderRow.appendChild(th);
    }

    tvShowsTable.appendChild(tvShowTableHeaderRow);

    // Populate TV show stream data
    for (let tvShow of tvShows) {
        let tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${tvShow.user}</td>
        <td>${tvShow.tvShow}</td>
        <td>${tvShow.season}</td>
        <td>${tvShow.episode}</td>
        <td>${tvShow.resolution}</td>
        <td>${tvShow.device}</td>
        <td>${tvShow.state}</td>
        <td>${tvShow.progress}</td>
      `;
        tvShowsTable.appendChild(tr);
    }
}

// Fetch and process the current streams data
function fetchStreams(serverUrl, plexToken) {
    const url = `${serverUrl}/status/sessions?X-Plex-Token=${plexToken}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data, 'text/xml');

            let videos = xmlDoc.getElementsByTagName('Video');
            let movies = [];
            let tvShows = [];

            for (let video of videos) {
                let user = video.getElementsByTagName('User')[0];
                let player = video.getElementsByTagName('Player')[0];

                let userName = user.getAttribute('title');
                let movieTitle = video.getAttribute('title');
                let movieDuration = video.getAttribute('duration');
                let progress = video.getAttribute('viewOffset');

                let streamResolution;
                let media = video.getElementsByTagName('Media')[0];
                if (media) {
                    streamResolution = media.getAttribute('videoResolution');
                }

                let playerDevice = player.getAttribute('device');

                let streamState = player.getAttribute('state');

                // Extract TV show, season, and episode information
                let tvShow = '';
                let season = '';
                let episode = '';

                let parentTitle = video.getAttribute('parentTitle');
                let grandparentTitle = video.getAttribute('grandparentTitle');
                let index = video.getAttribute('index');

                if (parentTitle && grandparentTitle && index) {
                    tvShow = grandparentTitle;
                    season = parentTitle;
                    episode = `Episode ${index}`;
                }

                let stream = {
                    user: userName,
                    tvShow: tvShow,
                    season: season,
                    episode: episode,
                    resolution: streamResolution,
                    device: playerDevice,
                    state: streamState,
                    progress: `${(progress / movieDuration * 100).toFixed(2)}%`,
                };

                // Categorize streams as movies or TV shows
                if (tvShow) {
                    tvShows.push(stream);
                } else {
                    movies.push({
                        user: stream.user,
                        title: movieTitle,
                        resolution: stream.resolution,
                        device: stream.device,
                        state: stream.state,
                        progress: stream.progress,
                    });
                }
            }

            // Populate the Current Streams table for movies
            populateMoviesTable(movies);

            // Populate the Current Streams table for TV shows
            populateTVShowsTable(tvShows);
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

document.getElementById('refreshLink').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the link from navigating
  
    // Perform the refresh action here
    loadData();
});