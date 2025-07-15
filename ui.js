

export class UIManager {
    constructor(blockManager) {
        this.blockManager = blockManager;
        this.activeSlot = 0;
        this.blockTypes = ['grass', 'stone', 'wood', 'dirt', 'water'];
        
        this.setupHotbar();
    }

    setupHotbar() {
        const slots = document.querySelectorAll('.hotbar-slot');
        
        slots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.setActiveSlot(index);
            });
        });
    }

    setActiveSlot(index) {
        if (index < 0 || index >= this.blockTypes.length) return;
        
        // Remove active class from all slots
        document.querySelectorAll('.hotbar-slot').forEach(slot => {
            slot.classList.remove('active');
        });
        
        // Add active class to selected slot
        const activeSlot = document.querySelector(`[data-slot="${index}"]`);
        if (activeSlot) {
            activeSlot.classList.add('active');
        }
        
        this.activeSlot = index;
    }

    getActiveBlockType() {
        return this.blockTypes[this.activeSlot];
    }
}

