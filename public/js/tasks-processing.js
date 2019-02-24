function getToken() {
    const neededTokens = document.cookie.split(';')
        .map((cookie) => cookie.trim())
        .filter((cookie) => cookie.startsWith('token='));
    if (neededTokens.length > 0) {
        return neededTokens[0].split('=')[1];
    } else {
        return null;
    }
}

function setToken(token) {
    document.cookie = `token=${token}`;
}

function createGraphQlFetchHeader(data) {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(data)
    };
}

function createGetPageQuery(pageEnum) {
    return {
        query: 'query GetPage($token: String, $page: PageEnum!) { getPage(token: $token, page: $page) { template loc } }',
        variables: { token: getToken(), page: pageEnum }
    };
}

function createGetTasksQuery(filters) {
    return {
        query: `query GetTasks($token: String, $filters: [Boolean]!) { getTasks(token: $token, filters: $filters) { 
            tasks { id name completeDate completed attachmentFileName } template loc 
        } }`,
        variables: { token: getToken(), filters: filters }
    };
}

function createDownloadAttachmentQuery(taskId) {
    return {
        query: 'query DownloadAttachment($token: String, $taskId: ID!) { downloadAttachment(token: $token, taskId: $taskId) { jsonedFile filename } }',
        variables: { token: getToken(), taskId: taskId }
    };
}

function createLoginMutation(username, password) {
    return {
        query: 'mutation Login($username: String!, $password: String!) { login(username: $username, password: $password) }',
        variables: { username: username, password: password }
    };
}

function createCompleteTaskMutation(taskId) {
    return {
        query: 'mutation CompleteTask($token: String, $taskId: ID!) { completeTask(token: $token, taskId: $taskId) }',
        variables: { token: getToken(), taskId: taskId }
    };
}

function createAddTaskMutation(taskName, taskCompleteDate, jsonedAttachment, filename) {
    return {
        query: `mutation AddTask($token: String, $taskName: String!, $taskCompleteDate: String!, $jsonedAttachment: String, $filename: String) { 
            addTask(token: $token, taskName: $taskName, taskCompleteDate: $taskCompleteDate, jsonedAttachment: $jsonedAttachment, filename: $filename)
        }`,
        variables: { token: getToken(), taskName: taskName, jsonedAttachment: jsonedAttachment, filename: filename, taskCompleteDate: taskCompleteDate }
    };
}

function onIndexLoad() {
    loadIndex();
}

function loadIndex() {
    fetch('/', createGraphQlFetchHeader(createGetPageQuery('INDEX')))
        .then((response) => response.json())
        .then((data) => {
            const page = data.data.getPage;
            if (page != null) {
                const loc = JSON.parse(page.loc);
                document.title = loc.title;
                document.getElementsByTagName('body')[0].innerHTML = ejs.render(page.template, loc);
                updateTasks();
            } else {
                loadLogin();
            }
        });
}

function loadLogin() {
    fetch('/', createGraphQlFetchHeader(createGetPageQuery('LOGIN')))
        .then((response) => response.json())
        .then((data) => {
            const page = data.data.getPage;
            if (page != null) {
                const loc = JSON.parse(page.loc);
                document.title = loc.title;
                document.getElementsByTagName('body')[0].innerHTML = ejs.render(page.template, loc);
            } else {
                loadLogin();
            }
        });
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

    fetch('/', createGraphQlFetchHeader(createLoginMutation(username.value, password.value)))
        .then((response) => response.json())
        .then((data) => {
            const token = data.data.login;
            if (token != null) {
                setToken(token);
                loadIndex();
            } else {
                loadLogin();
            }
        });
}

function updateTasks() {
    const filters = Array.from(document.getElementsByName('isCompletedFilter'))
        .filter((element) => element.checked).map((element) => element.value === 'true');
    fetch('/', createGraphQlFetchHeader(createGetTasksQuery(filters)))
        .then((response) => response.json())
        .then((data) => {
            const response = data.data.getTasks;
            if (response != null) {
                const loc = JSON.parse(response.loc);
                const tasks = Array.from(response.tasks);
                tasks.forEach((task) => task.completeDate = new Date(Number(task.completeDate)));
                document.getElementById('task-list').innerHTML = tasks.map(function (task) {
                    task.completeDate = new Date(task.completeDate);
                    return createTaskEntry(task, response.template, loc);
                }).join('');
            } else {
                alert('Error updating tasks');
            }
        });
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

    function sendTaskAndUpdate(jsonedData, filename) {
        fetch('/', createGraphQlFetchHeader(createAddTaskMutation(taskNameElement.value, completeDateElement.value, jsonedData, filename)))
            .then((response) => response.json())
            .then((data) => {
                if (data.data.addTask) {
                    updateTasks();
                } else {
                    alert('Error adding task');
                }
            });
    }

    const file = document.getElementsByName('newTaskAttachment')[0];
    if (file.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e)
        {
            sendTaskAndUpdate(JSON.stringify(new Uint8Array(e.target.result)), file.files[0].name);
        };
        reader.readAsArrayBuffer(file.files[0]);
    } else {
        sendTaskAndUpdate(null, null);
    }
}

function completeTaskAndUpdateTasks(taskId) {
    fetch('/', createGraphQlFetchHeader(createCompleteTaskMutation(taskId)))
        .then((response) => response.json())
        .then((data) => {
            if (data.data.completeTask) {
                updateTasks();
            } else {
                alert('Error completing task');
            }
        });
}

function bufferToArrayBuffer(buffer) {
    const arrayBuffer = new ArrayBuffer(buffer.length),
        view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return arrayBuffer;
}

function downloadAttachment(taskId) {
    fetch('/', createGraphQlFetchHeader(createDownloadAttachmentQuery(taskId)))
        .then((response) => response.json())
        .then((data) => {
            const response = data.data.downloadAttachment;
            if (response != null) {
                const kek = [JSON.parse(response.jsonedFile)];
                const temp = document.createElement('a'),
                    file = new File([bufferToArrayBuffer(JSON.parse(response.jsonedFile).data)], response.filename);
                temp.href = window.URL.createObjectURL(file);
                temp.download = file.name;
                document.body.appendChild(temp);
                temp.click();
                document.body.removeChild(temp);
            } else {
                alert('Download error');
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
