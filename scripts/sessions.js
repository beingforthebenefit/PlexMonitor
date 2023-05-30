const getCurrentSessions = async (serverUrl, plexToken) => {
    const url = `${serverUrl}/status/sessions?X-Plex-Token=${plexToken}`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            // data is the XML response from the server
            // parse it and extract the information you need
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data,"text/xml");
            // TODO: extract information from xmlDoc
        })
        .catch(error => console.error('Error:', error));
}

export default getCurrentSessions