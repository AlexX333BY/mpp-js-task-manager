const socket = io();

socket.on('index-page', function (page) {
    const response = JSON.parse(page);
    document.title = response.loc.title;
    document.getElementsByTagName('body')[0].innerHTML = ejs.render(response.template, response.loc);
    updateTasks();
});

socket.on('login-page', function (page) {
    const response = JSON.parse(page);
    document.title = response.loc.title;
    document.getElementsByTagName('body')[0].innerHTML = ejs.render(response.template, response.loc);
});

socket.on('tasks', function (tasks) {
    const response = JSON.parse(tasks);
    document.getElementById('task-list').innerHTML = response.tasks.map(function (task) {
        task.completeDate = new Date(task.completeDate);
        return createTaskEntry(task, response.template, response.loc);
    }).join('');
});

function onIndexLoad() {
    loadIndex();
}

function loadIndex() {
    socket.emit('index-page');
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

    socket.emit('login', username.value, password.value)
}

function updateTasks() {
    const filters = document.getElementsByName('isCompletedFilter')
        .filter((element) => element.checked).map((element) => element.value);
    socket.emit('tasks', filters);
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

function addNewAndUpdateTasks() {
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

    socket.emit('add-task', taskNameElement.value, completeDateElement.value/*, file buffer*/);
}

function completeTaskAndUpdateTasks(taskId) {
    socket.emit('complete-task', taskId);
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
