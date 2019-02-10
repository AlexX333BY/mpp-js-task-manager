function updateTasksAsync() {
    const filterElements = document.getElementsByName('isCompletedFilter'),
        filters = [],
        statusRequestParameterName = 'isCompleted';

    let filterElement;
    for (let index = 0; index < filterElements.length; ++index) {
        filterElement = filterElements[index];
        if (filterElement.checked) {
            filters.push(statusRequestParameterName + '=' + filterElement.value);
        }
    }

    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", '/tasks?' + filters.join('&'), true);
    xmlHttp.onload = function() {
        if (xmlHttp.status === 200) {
            document.getElementById('task-list').innerHTML = JSON.parse(xmlHttp.responseText).join('');
        } else {
            alert('Error getting tasks, please try later');
        }
    };
    xmlHttp.send(null);
}
