/*!
 * Modal Component - ?Ÿç? JavaScript é¡žåˆ¥ + jQuery ?¼å®¹ (ä»?Bootstrap)
 * ???¯æ´å¤šå±¤ Modal ?Šå? (Multiple modals)
 */
(function() {
    'use strict';

    // æ´¾ç™¼?™é?äº‹ä»¶
    function dispatchDualEvent(element, eventName) {
        element.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
        if (window.jQuery) window.jQuery(element).trigger(eventName);
    }

    // ?¯è??¦å?ç´?
    function focusableElements(el) {
        return Array.from(el.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex]:not([tabindex="-1"]), *[contenteditable]'))
                    .filter(e => e.offsetWidth > 0 || e.offsetHeight > 0 || e === document.activeElement);
    }

    // ?–å??Žæ¸¡?‚é?
    function getTransitionDuration(element) {
        const style = window.getComputedStyle(element);
        const duration = style.transitionDuration.split(',')[0];
        return Number(duration.replace('s', '')) * 1000;
    }

    const DefaultOptions = {
        backdrop: true,
        keyboard: true,
        focus: true
    };

    // ?”¢ ?¨å?ç®¡ç??‹å???Modal ?¸é?
    let openModalCount = 0;

    // Modal é¡žåˆ¥
    function Modal(element, options) {
        this._element = element;
        this._options = Object.assign({}, DefaultOptions, options);
        this._isTransitioning = false;
        this._lastActive = null;
        this._backdrop = null;
        this._zIndexBase = 1050; // Bootstrap ?è¨­ z-index èµ·é?

        element.modalInstance = this; 
        
        this._element.setAttribute('role', this._element.getAttribute('role') || 'dialog');
        this._element.setAttribute('aria-hidden', 'true');
        if (!this._element.hasAttribute('tabindex')) this._element.setAttribute('tabindex', '-1');

        this._setListeners();
    }

    Modal.prototype.toggle = function() {
        this._element.classList.contains('show') ? this.hide() : this.show();
    };

    Modal.prototype.show = function() {
        if (this._isTransitioning || this._element.classList.contains('show')) return;

        dispatchDualEvent(this._element, 'show.bs.modal');
        this._isTransitioning = true;
        this._lastActive = document.activeElement;

        // å¢žå??¨å?å±¤æ•¸
        openModalCount++;
		
		if (openModalCount === 1) {
            document.body.style.overflow = 'hidden'; 
        }

        // å»ºç? Backdrop
        this._handleBackdrop(openModalCount);

        // è¨­å? z-index ?Šå?ï¼ˆæ?å±?+20ï¼?
        const modalZ = this._zIndexBase + openModalCount * 20;
        this._element.style.zIndex = modalZ;
        if (this._backdrop) this._backdrop.style.zIndex = modalZ - 10;

        this._element.style.display = 'block';
        this._element.scrollTop = 0;
        
        document.body.classList.add('modal-open');
        this._element.setAttribute('aria-hidden', 'false');

        // è§¸ç™¼?ç¹ªä»¥å???transition
        this._element.offsetWidth; 
        if (this._backdrop) this._backdrop.classList.add('show');
        this._element.classList.add('show');

        const duration = getTransitionDuration(this._element);
        const completeShow = () => {
            this._element.removeEventListener('transitionend', completeShow);
            this._isTransitioning = false;
            if (this._options.focus) {
                const focusables = focusableElements(this._element);
                const firstFocusable = focusables.length ? focusables[0] : this._element;
                firstFocusable.focus();
            }
            dispatchDualEvent(this._element, 'shown.bs.modal');
        };

        if (duration > 0) this._element.addEventListener('transitionend', completeShow);
        else setTimeout(completeShow, 0);
    };

    Modal.prototype.hide = function() {
        if (this._isTransitioning || !this._element.classList.contains('show')) return;

        dispatchDualEvent(this._element, 'hide.bs.modal');
        this._isTransitioning = true;

        this._element.classList.remove('show');
        if (this._backdrop) this._backdrop.classList.remove('show');

        const duration = getTransitionDuration(this._element);
        const completeHide = () => {
            this._element.removeEventListener('transitionend', completeHide);
            this._element.style.display = 'none';
            this._element.setAttribute('aria-hidden', 'true');
            this._isTransitioning = false;

            // ?¢å¾©?¦é?
            if (this._lastActive && typeof this._lastActive.focus === 'function') {
                try { this._lastActive.focus(); } catch(e) {}
            }

            // ç§»é™¤?ªå·±??±¤??backdrop
            if (this._backdrop) {
                this._backdrop.remove();
                this._backdrop = null;
            }

            // å±¤æ•¸ -1
            openModalCount--;
            if (openModalCount === 0){
				document.body.style.overflow = '';
				document.body.classList.remove('modal-open');
			}

            dispatchDualEvent(this._element, 'hidden.bs.modal');
        };

        if (duration > 0) this._element.addEventListener('transitionend', completeHide);
        else setTimeout(completeHide, 0);
    };

    Modal.prototype._handleFocusTrap = function(e) {
        if (e.key !== 'Tab' || !this._options.focus) return;
        const focusables = focusableElements(this._element);
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            last.focus(); e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus(); e.preventDefault();
        }
    };

    Modal.prototype._setListeners = function() {
        // ?œé??‰é?
        this._element.addEventListener('click', e => {
            if (e.target.closest('[data-bs-dismiss="modal"]')) {
                e.preventDefault(); this.hide();
            }
        });

        // é»žæ?ç©ºç™½??(backdrop)
        this._element.addEventListener('click', e => {
            if (e.target === this._element && this._options.backdrop !== 'static') {
                this.hide();
            }
        });

        // ?¦é??·é˜±
        this._element.addEventListener('keydown', this._handleFocusTrap.bind(this));
    };

    // ???¯æ´å¤šé? modal ??backdrop
    Modal.prototype._handleBackdrop = function(level) {
        if (!this._options.backdrop) return;
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade';
        backdrop.dataset.level = level;
        document.body.appendChild(backdrop);
        backdrop.style.display = 'block';
        this._backdrop = backdrop;
    };

    // ----------------------------------------------------------------------------
    // jQuery / Auto Init
    Modal.getOrCreateInstance = function(element, config) {
        return element.modalInstance || new Modal(element, config);
    };

    Modal._jQueryInterface = function(config) {
        return this.each(function() {
            const $this = window.jQuery(this);
            let instance = $this.data('bs.modal');
            const _config = typeof config === 'object' ? config : null;
            if (!instance) {
                instance = Modal.getOrCreateInstance(this, _config);
                $this.data('bs.modal', instance);
            }
            if (typeof config === 'string' && instance[config]) instance[config]();
        });
    };

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll('.modal').forEach(el => Modal.getOrCreateInstance(el));

        // é»žæ?è§¸ç™¼
        document.body.addEventListener('click', e => {
            const trigger = e.target.closest('[data-bs-toggle="modal"]');
            if (!trigger) return;
            e.preventDefault();
			// ÀË¬d data-bs-target (JS ·|Âà¬° dataset.bsTarget)
			// ©ÎÀË¬d data-target
			// ©ÎÀË¬d href
			const targetSelector = trigger.dataset.bsTarget || trigger.dataset.target || trigger.getAttribute('href');
            const modal = document.querySelector(targetSelector);
            if (modal) Modal.getOrCreateInstance(modal).show();
        });

        // ESC ??
        if (DefaultOptions.keyboard) {
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape') {
                    const modals = document.querySelectorAll('.modal.show');
                    if (modals.length) {
                        const top = modals[modals.length - 1];
                        if (top.modalInstance) top.modalInstance.hide();
                    }
                }
            });
        }

        // jQuery ?’ä»¶
        if (window.jQuery) window.jQuery.fn.modal = Modal._jQueryInterface;
    });
})();
