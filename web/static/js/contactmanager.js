export class Contactmanager {
    constructor(localPeerId) {
        this.contacts = new Map();
        this.localPeerId = localPeerId;
        this.currentPeerId = null;
        this.init();
    }

    addContact(contactId, onClickHandler = null) {
        if (!this.contactList || !contactId ||
            this.contacts.has(contactId) ||
            contactId === this.localPeerId) {
            return;
        }

        const contactItem = this.createContactElement(contactId, onClickHandler);
        this.contacts.set(contactId, contactItem);
        this.contactList.appendChild(contactItem);
    }

    createContactElement(contactId, onClickHandler) {
        const contactItem = document.createElement('li');
        contactItem.className = 'contact-item';
        contactItem.innerHTML = `
            <div class="contact-content">
                <div class="contact-details">${contactId}</div>
                <span class="status-indicator online"></span>
            </div>
        `;

        contactItem.addEventListener('click', () => {
            this.selectContact(contactId);
            this.highlightContact(contactItem);
            if (onClickHandler) onClickHandler(contactId);
        });

        return contactItem;
    }

    init() {
        // Initialize DOM elements
        this.contactList = document.getElementById('contactList');
        this.searchInput = document.getElementById('contactSearch');
        this.remotePeerIdInput = document.getElementById('remotePeerID');

        // Add search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterContacts(e.target.value);
            });
        }
    }

    addContact(contactId, onClickHandler = null) {
        // Don't add if contact already exists or it's the local user
        if (!this.contactList ||
            !contactId ||
            this.contacts.has(contactId) ||
            contactId === this.localPeerId) {
            return;
        }

        // Create contact element
        const contactItem = document.createElement('li');
        contactItem.className = 'contact-item';

        // Create contact content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'contact-content';

        // Create contact details
        const details = document.createElement('div');
        details.className = 'contact-details';
        details.textContent = contactId;

        // Create online indicator
        const status = document.createElement('span');
        status.className = 'status-indicator online';  // Make sure it's green
        status.style.backgroundColor = 'green'; // Green color for online status

        // Assemble contact item
        contentWrapper.appendChild(details);
        contentWrapper.appendChild(status);
        contactItem.appendChild(contentWrapper);

        // Add click handler (optional)
        contactItem.addEventListener('click', () => {
            this.selectContact(contactId);
            this.highlightContact(contactItem);
            if (onClickHandler) {
                onClickHandler(contactId);  // Invoke the custom onclick handler if provided
            }
        });

        // Store contact reference
        this.contacts.set(contactId, contactItem);

        // Add to DOM
        this.contactList.appendChild(contactItem);
    }

    removeContact(contactId) {
        const contactItem = this.contacts.get(contactId);
        if (contactItem) {
            contactItem.remove();
            this.contacts.delete(contactId);
        }
    }

    selectContact(contactId) {
        this.currentPeerId = contactId;
        if (this.remotePeerIdInput) {
            this.remotePeerIdInput.value = contactId;
        }
        if (window.startConnection) {
            window.startConnection(contactId);
        }
    }

    highlightContact(contactItem) {
        // Remove highlight from all contacts
        this.contacts.forEach(item => {
            item.classList.remove('selected');
        });
        // Add highlight to selected contact
        contactItem.classList.add('selected');
    }

    filterContacts(searchTerm) {
        this.contacts.forEach((contactItem, contactId) => {
            const shouldShow = contactId.toLowerCase().includes(searchTerm.toLowerCase());
            contactItem.style.display = shouldShow ? 'block' : 'none';
        });
    }
}
