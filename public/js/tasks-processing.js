function updateTasksAsync() {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", '/tasks', true);
    xmlHttp.onload = function() {
        if (xmlHttp.status === 200) {
            document.getElementById('task-list').innerHTML = JSON.parse(xmlHttp.responseText).join('');
        } else {
            alert('Error getting tasks, please try later');
        }
    };
    xmlHttp.send(null);
}
