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

    const xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("GET", '/tasks?' + filters.join('&'), true);
    xmlHttpRequest.onload = function() {
        if (xmlHttpRequest.status === 200) {
            document.getElementById('task-list').innerHTML = JSON.parse(xmlHttpRequest.responseText).join('');
        } else {
            alert(xmlHttpRequest.statusText);
        }
    };
    xmlHttpRequest.send(null);
}

function addNewAndUpdateTasksAsync() {
    const taskNameElement = document.getElementsByName('newTaskName')[0];
    const completeDateElement = document.getElementsByName('newTaskExpectedCompleteDate')[0];

    if (!isInputLegal(taskNameElement)) {
        setInputLegality(taskNameElement, false);
        return;
    }

    if (!isInputLegal(completeDateElement)) {
        setInputLegality(completeDateElement, false);
        return;
    }

    const xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("POST", '/addTask', true);
    xmlHttpRequest.onload = function() {
        if (xmlHttpRequest.status === 200) {
            updateTasksAsync();
        } else {
            alert(xmlHttpRequest.statusText);
        }
    };
    xmlHttpRequest.send(new FormData(document.getElementById('new-task-form')));
}

function completeTaskAndUpdateTasksAsync(taskId) {
    const data = new FormData();
    data.append('taskId', taskId);

    const xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("POST", '/completeTask', true);
    xmlHttpRequest.onload = function() {
        if (xmlHttpRequest.status === 200) {
            updateTasksAsync();
        } else {
            alert(xmlHttpRequest.statusText);
        }
    };
    xmlHttpRequest.send(data);
}

function isInputLegal(inputElement) {
    return inputElement.value.toString().length > 0;
}

function setInputLegality(inputElement, isLegal) {
    const illegalInputClass = 'illegal-input';

    if (isLegal) {
        inputElement.classList.remove(illegalInputClass);
    } else {
        inputElement.classList.add(illegalInputClass);
    }
}
