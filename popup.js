document.addEventListener("DOMContentLoaded", function() {
    const memoContainer = document.getElementById("memo-container");
    const addMemoButton = document.getElementById("add-memo");

    function loadMemos() {
        chrome.storage.local.get(["memos"], function(result) {
            memoContainer.innerHTML = "";
            const memos = result.memos || [];
            memos.forEach((text, index) => {
                addMemoElement(text, index);
            });
            addDragAndDrop();
        });
    }

    function addMemoElement(text = "", index) {
        const memoDiv = document.createElement("div");
        memoDiv.classList.add("memo-item");
        memoDiv.draggable = true;
        memoDiv.dataset.index = index;

        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.addEventListener("input", saveMemos);

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        const copyButton = document.createElement("button");
        copyButton.textContent = "COPY";
        copyButton.classList.add("copy-btn");
        copyButton.addEventListener("click", function() {
            textArea.select();
            document.execCommand("copy");
            alert("Copied!");
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "delete";
        deleteButton.classList.add("delete-btn");
        deleteButton.addEventListener("click", function() {
            if (confirm("Are you sure?")) {
                deleteMemo(index);
            }
        });

        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(deleteButton);

        memoDiv.appendChild(textArea);
        memoDiv.appendChild(buttonContainer);
        memoContainer.appendChild(memoDiv);
    }

    function saveMemos() {
        const memoTexts = Array.from(document.querySelectorAll(".memo-item textarea")).map(t => t.value);
        chrome.storage.local.set({ memos: memoTexts });
    }

    function deleteMemo(index) {
        chrome.storage.local.get(["memos"], function(result) {
            let memos = result.memos || [];
            memos.splice(index, 1);
            chrome.storage.local.set({ memos: memos }, loadMemos);
        });
    }

    function addDragAndDrop() {
        let draggedItem = null;

        document.querySelectorAll(".memo-item").forEach(item => {
            item.addEventListener("dragstart", function() {
                draggedItem = this;
                setTimeout(() => this.classList.add("dragging"), 0);
            });

            item.addEventListener("dragover", function(e) {
                e.preventDefault();
                const afterElement = getDragAfterElement(memoContainer, e.clientY);
                if (afterElement == null) {
                    memoContainer.appendChild(draggedItem);
                } else {
                    memoContainer.insertBefore(draggedItem, afterElement);
                }
            });

            item.addEventListener("dragend", function() {
                this.classList.remove("dragging");
                saveNewOrder();
            });
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(".memo-item:not(.dragging)")];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function saveNewOrder() {
        const memoTexts = Array.from(document.querySelectorAll(".memo-item textarea")).map(t => t.value);
        chrome.storage.local.set({ memos: memoTexts });
    }

    addMemoButton.addEventListener("click", function() {
        chrome.storage.local.get(["memos"], function(result) {
            let memos = result.memos || [];
            memos.push("");
            chrome.storage.local.set({ memos: memos }, loadMemos);
        });
    });

    loadMemos();
});