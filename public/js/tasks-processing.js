const socket = io();

socket.on('index-page', function (template, loc) {
    document.title = loc.title;
    document.getElementsByTagName('body')[0].innerHTML = ejs.render(template, loc);
    updateTasks();
});

socket.on('login-page', function (template, loc) {
    document.title = loc.title;
    document.getElementsByTagName('body')[0].innerHTML = ejs.render(template, loc);
});

socket.on('tasks', function (tasks, template, loc) {
    document.getElementById('task-list').innerHTML = tasks.map(function (task) {
        task.completeDate = new Date(task.completeDate);
        return createTaskEntry(task, template, loc);
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

    socket.emit('login', username.value, password.value, function (errorCode) {
        if (errorCode == 200) {
            socket.emit('index-page');
        } else {
            socket.emit('login-page');
        }
    });
}

function updateTasks() {
    const filters = Array.from(document.getElementsByName('isCompletedFilter'))
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


    const file = document.getElementsByName('newTaskAttachment')[0];
    if (file.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e)
        {
            socket.emit('add-task', taskNameElement.value, completeDateElement.value, e.target.result, file.files[0].name, function (error) {
                updateTasks();
            });
        };
        reader.readAsArrayBuffer(file.files[0]);
    } else {
        socket.emit('add-task', taskNameElement.value, completeDateElement.value, null, null, function (error) {
            updateTasks();
        });
    }
}

function completeTaskAndUpdateTasks(taskId) {
    socket.emit('complete-task', taskId, function (errorCode) {
        if (errorCode == 200) {
            updateTasks();
        } else {
            alert(errorCode);
        }
    });
}

function downloadAttachment(taskId) {
    socket.emit('download-attachment', taskId, function (errorCode, data, filename) {
       if (errorCode == 200) {
           const temp = document.createElement('a'),
               file = new File([data], filename.split('/').pop());
           temp.href = window.URL.createObjectURL(file);
           temp.download = file.name;
           document.body.appendChild(temp);
           temp.click();
           document.body.removeChild(temp);
       } else {
           alert(errorCode);
       }
    });
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
