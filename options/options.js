// Saves options to browser.storage

function save_options() {
    var plexUrl = document.getElementById('plexUrl').value;
    var plexToken = document.getElementById('plexToken').value;

    browser.storage.local.set({
        plexUrl: plexUrl,
        plexToken: plexToken
    }).then(function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    }, function(error) {
        console.log(`Error: ${error}`);
    });
}

// Restores select box and checkbox state using the preferences stored in browser.storage.
function restore_options() {
    browser.storage.local.get({
        plexUrl: '',
        plexToken: '',
    }).then(function(items) {
        document.getElementById('plexUrl').value = items.plexUrl;
        document.getElementById('plexToken').value = items.plexToken;
    }, function(error) {
        console.log(`Error: ${error}`);
    });
}

document.getElementById('options-form').addEventListener('submit', function(e) {
    e.preventDefault();
    save_options();
});

document.addEventListener('DOMContentLoaded', restore_options);