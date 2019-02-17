function onIndexLoad() {
    loadIndexAsync();
}

function loadIndexAsync() {
    const xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("GET", '/index', true);
    xmlHttpRequest.onload = function() {
        switch (xmlHttpRequest.status) {
            case 401:
                loadLoginAsync();
                break;
            case 200:
                const response = JSON.parse(xmlHttpRequest.response);
                document.title = response.loc.title;
                document.getElementsByTagName('body')[0].innerHTML = ejs.render(response.template, response.loc);
                updateTasksAsync();
                break;
            default:
                alert(xmlHttpRequest.statusText);
                break;
        }
    };
    xmlHttpRequest.send(null);
}

function loadLoginAsync() {
    const xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("GET", '/login', true);
    xmlHttpRequest.onload = function() {
        if (xmlHttpRequest.status === 200) {
            const response = JSON.parse(xmlHttpRequest.response);
            document.title = response.loc.title;
            document.getElementsByTagName('body')[0].innerHTML = ejs.render(response.template, response.loc);
        } else {
            alert(xmlHttpRequest.statusText);
        }
    };
    xmlHttpRequest.send(null);
}

function onLoginQuery() {
    const username = document.getElementsByName('username')[0];
    const password = document.getElementsByName('password')[0];

    if (!isInputLegal(username)) {
        setInputLegality(username, false);
        return;
    }

    if (!isInputLegal(password)) {
        setInputLegality(password, false);
        return;
    }

    const xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("POST", '/login', true);
    xmlHttpRequest.onload = function() {
        switch (xmlHttpRequest.status) {
            case 200:
                loadIndexAsync();
                break;
            default:
                alert(xmlHttpRequest.statusText);
                break;
        }
    };
    xmlHttpRequest.send(new FormData(document.getElementById('login-form')));
}

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
        switch (xmlHttpRequest.status) {
            case 401:
                loadLoginAsync();
                break;
            case 200:
                const response = JSON.parse(xmlHttpRequest.response);
                document.getElementById('task-list').innerHTML = response.tasks.map(function (task) {
                    task.completeDate = new Date(task.completeDate);
                    return createTaskEntry(task, response.template, response.loc);
                }).join('');
                break;
            default:
                alert(xmlHttpRequest.statusText);
        }
    };
    xmlHttpRequest.send(null);
}

function createTaskEntry(task, template, loc) {
    const taskEntry = { taskId: task.id, taskName: task.name, taskAttachment: task.attachmentFileName,
        downloadAttachment: loc.downloadAttachment, completeTask: loc.completeTaskButton };

    taskEntry.expectedCompleteDate = task.completeDate.getDate() + '.' + (task.completeDate.getMonth() + 1) + '.'
        + task.completeDate.getFullYear();

    if (isTaskCompleted(task)) {
        taskEntry.taskStatus = loc.completedStatus;
        taskEntry.completeTaskDisabled = 'disabled';
    } else {
        taskEntry.taskStatus = loc.nonCompletedStatus;
        taskEntry.completeTaskDisabled = '';
    }

    if (task.attachmentFileName == null) {
        taskEntry.downloadAttachmentDisabled = 'disabled';
    } else {
        taskEntry.downloadAttachmentDisabled = '';
    }

    if (isTaskExpired(task)) {
        taskEntry.taskEntryClass = 'expired-task-entry';
    } else {
        taskEntry.taskEntryClass = 'task-entry';
    }

    return ejs.render(template, taskEntry);
}

function isTaskCompleted(task) {
    return task.completed;
}

function isTaskExpired(task) {
    return (!isTaskCompleted(task) && (task.completeDate < new Date()));
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
        switch (xmlHttpRequest.status) {
            case 401:
                loadLoginAsync();
                break;
            case 200:
                updateTasksAsync();
                break;
            default:
                alert(xmlHttpRequest.statusText);
                break;
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
        switch (xmlHttpRequest.status) {
            case 401:
                loadLoginAsync();
                break;
            case 200:
                updateTasksAsync();
                break;
            default:
                alert(xmlHttpRequest.statusText);
                break;
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
