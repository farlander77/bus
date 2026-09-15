/*!
 * Tab/Pills Component - 原生 JavaScript + jQuery 兼容 (仿 Bootstrap)
 * 修正：支援巢狀結構 (通過查找當前活躍 Trigger 所指向的 Pane ID)
 */
(function() {
    'use strict';

    // 1. Helper Function: 派發雙重事件 (原生 CustomEvent 和 jQuery Event)
    function dispatchDualEvent(element, eventName) {
        // 派發原生 CustomEvent
        element.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));

        // 檢查並派發 jQuery 事件
        if (window.jQuery) {
            window.jQuery(element).trigger(eventName);
        }
    }

    /**
     * 核心 Tab/Pill 切換邏輯 (修正：不依賴 .tab-content 容器的父層查找)
     * @param {HTMLElement} trigger - 被點擊的 tab/pill 按鈕元素
     */
    function activateTab(trigger) {
        // 1. 識別目標內容區塊 (tab-pane)
        const targetSelector = trigger.getAttribute('data-bs-target');
        const targetPane = document.querySelector(targetSelector);

        if (!targetPane) return;

        // 2. 找出當前活躍元素 (在當前的 .nav-pills 容器內查找)
        const tabPillsContainer = trigger.closest('.nav-pills');
        
        // 找到目前在這個 Tab List 內活躍的 Trigger
        // 選擇器限定為擁有 data-bs-toggle 屬性的 .active 元素，防止誤選到其他非 Trigger 的 .active 元素
        const currentlyActiveTrigger = tabPillsContainer.querySelector('.active[data-bs-toggle="tab"], .active[data-bs-toggle="pill"]');
        
        // 如果點擊的是當前活躍的 Tab，則不做任何事
        if (trigger === currentlyActiveTrigger) return; 

        // 3. 找出當前活躍的 Tab Pane
        let currentlyActivePane = null;

        if (currentlyActiveTrigger) {
            // 根據目前活躍 Trigger 所指向的 Tab Pane ID 進行全域查找
            const activeTargetSelector = currentlyActiveTrigger.getAttribute('data-bs-target');
            
            // 全域查找該 ID 對應的 Pane
            currentlyActivePane = document.querySelector(activeTargetSelector);
        }

        // 4. 隱藏當前活躍的 Tab Pane
        // 確保找到活躍的 Trigger 和對應的 Pane 才能隱藏
        if (currentlyActivePane && currentlyActiveTrigger) {
            // 觸發 hide.bs.tab (開始隱藏)
            dispatchDualEvent(currentlyActivePane, 'hide.bs.tab');

            // 移除樣式 (Trigger)
            currentlyActiveTrigger.classList.remove('active');
            currentlyActiveTrigger.setAttribute('aria-selected', 'false');

            // 進行隱藏 (Pane)
            currentlyActivePane.classList.remove('show', 'active');
            currentlyActivePane.style.display = 'none';

            // 觸發 hidden.bs.tab (完成隱藏)
            dispatchDualEvent(currentlyActivePane, 'hidden.bs.tab');
        }

        // 5. 顯示目標 Tab Pane

        // 觸發 show.bs.tab (開始顯示)
        dispatchDualEvent(targetPane, 'show.bs.tab');

        // 新增樣式 (Trigger)
        trigger.classList.add('active');
        trigger.setAttribute('aria-selected', 'true');
        
        // 進行顯示 (Pane)
        targetPane.style.display = 'block';

        // 使用 setTimeout 來模擬 CSS 過渡效果（確保 .show/active 樣式能觸發動畫）
        setTimeout(() => {
            targetPane.classList.add('show', 'active');
            // 觸發 shown.bs.tab (完成顯示)
            dispatchDualEvent(targetPane, 'shown.bs.tab');
        }, 10);
    }


    // -----------------------------------------------------------------------------------
    // --- 初始化與事件綁定 (使用原生 DOMContentLoaded 替代 $(document).ready) ---

    document.addEventListener("DOMContentLoaded", function () {
        
        // 1. 頁面載入初始化邏輯 (確保樣式和 display: none/block 同步)
        // 由於您希望 tab-pane 不必是 .tab-content 的直接子元素，這裡的初始化邏輯可以保持不變
        document.querySelectorAll('.tab-content').forEach(container => {
            // 注意：這裡只會處理 .tab-content 容器內的直接/間接 .tab-pane
            container.querySelectorAll('.tab-pane').forEach(pane => {
                if (pane.classList.contains('active')) {
                    pane.classList.add('show');
                    pane.style.display = 'block';
                } else {
                    pane.classList.remove('show');
                    pane.style.display = 'none';
                }
            });
        });


        // 2. 事件委託：處理 [data-bs-toggle="tab"] 或 [data-bs-toggle="pill"] 點擊
        document.body.addEventListener('click', function(e) {
            // 找出最接近的 tab/pill 觸發元素
            const trigger = e.target.closest('[data-bs-toggle="tab"], [data-bs-toggle="pill"]');
            
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();
                
                activateTab(trigger);
            }
        });

        // 3. 註冊 jQuery 插件 (若 jQuery 存在)
        if (window.jQuery) {
             window.jQuery.fn.tab = function(action) {
                 // 這裡的 this 是 jQuery 物件
                 return this.each(function() {
                     const $this = window.jQuery(this);
                     const isTabTrigger = $this.is('[data-bs-toggle="tab"], [data-bs-toggle="pill"]');

                     // 僅處理 'show' 方法並確保目標是 Tab 觸發器
                     if (isTabTrigger && action === 'show') {
                         activateTab(this); // 呼叫原生邏輯
                     }
                 });
             };
        }
    });

})();