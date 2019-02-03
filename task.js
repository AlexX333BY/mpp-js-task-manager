let fs = require('fs');

class Task {
    constructor(name, completeDate, attachmentFileName = null) {
        this.attachmentFileName = attachmentFileName;
        this.completeDate = completeDate;
        this.name = name;
        this.status = 'nonCompleted';
    }

    isCompleted() {
        return this.status === 'completed';
    }

    isExpired() {
        return (!this.isCompleted() && (this.completeDate < new Date()));
    }

    complete() {
        this.status = 'completed';
    }

    static transformToTask(obj) {
        if (!obj.hasOwnProperty('name') || !obj.hasOwnProperty('completeDate')
            || !obj.hasOwnProperty('status') || !obj.hasOwnProperty('attachmentFileName')
            || isNaN(Date.parse(obj.completeDate))
            || ((obj.attachmentFileName !== null) && !fs.existsSync(obj.attachmentFileName))) {
            return null;
        } else {
            let task = new Task(obj.name, new Date(obj.completeDate), obj.attachmentFileName);
            task.status = obj.status;
            return task;
        }
    }
}

module.exports = Task;
