document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. Theme Toggle (Light / Dark Mode)
    // ----------------------------------------------------
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const toggleIcon = themeToggleBtn.querySelector('.toggle-icon');
    
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleIcon.textContent = '☀️';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        toggleIcon.textContent = '🌙';
    }
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            toggleIcon.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            toggleIcon.textContent = '☀️';
        }
    });

    // ----------------------------------------------------
    // 2. Header Style & Active Links on Scroll
    // ----------------------------------------------------
    const header = document.querySelector('.header');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Intersection Observer for scroll highlighting
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px', // Trigger when section is in middle of viewport
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));

    // ----------------------------------------------------
    // 3. Family Profiles - Likes Feature
    // ----------------------------------------------------
    const likeButtons = document.querySelectorAll('.btn-like');
    
    // Load existing likes
    likeButtons.forEach(btn => {
        const name = btn.getAttribute('data-name');
        const countSpan = document.getElementById(`like-${name}`);
        const savedLikes = localStorage.getItem(`likes-${name}`) || '0';
        countSpan.textContent = savedLikes;
        
        // Mark as liked if user liked it in this session
        if (sessionStorage.getItem(`liked-${name}`)) {
            btn.classList.add('liked');
        }
        
        btn.addEventListener('click', () => {
            let currentLikes = parseInt(localStorage.getItem(`likes-${name}`) || '0');
            const hasLiked = sessionStorage.getItem(`liked-${name}`);
            
            if (!hasLiked) {
                currentLikes += 1;
                localStorage.setItem(`likes-${name}`, currentLikes);
                sessionStorage.setItem(`liked-${name}`, 'true');
                btn.classList.add('liked');
            } else {
                currentLikes -= 1;
                localStorage.setItem(`likes-${name}`, currentLikes);
                sessionStorage.removeItem(`liked-${name}`);
                btn.classList.remove('liked');
            }
            countSpan.textContent = currentLikes;
        });
    });

    // ----------------------------------------------------
    // 4. Memory Gallery Filter & Lightbox
    // ----------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    // Filter click handler
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            galleryItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (filterValue === 'all' || itemCategory === filterValue) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Lightbox Functionality
    const lightbox = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    
    let activeImages = [];
    let currentImgIndex = 0;
    
    // Helper to get currently visible items
    const updateActiveImages = () => {
        activeImages = Array.from(galleryItems).filter(item => item.style.display !== 'none');
    };
    
    const showLightbox = (index) => {
        updateActiveImages();
        if (activeImages.length === 0) return;
        
        currentImgIndex = index;
        const currentItem = activeImages[currentImgIndex];
        const imgSrc = currentItem.getAttribute('data-src');
        const imgAlt = currentItem.querySelector('img').getAttribute('alt');
        const title = currentItem.querySelector('h4').textContent;
        const desc = currentItem.querySelector('p').textContent;
        
        // Set lightbox contents
        // Use Unsplash fallback if the local file isn't loaded yet
        lightboxImg.src = imgSrc;
        lightboxImg.onerror = function() {
            this.src = currentItem.querySelector('img').src; // Copy source (which handles its own Unsplash fallback)
        };
        lightboxCaption.innerHTML = `<strong>${title}</strong><br><small>${desc}</small>`;
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Stop body scrolling
    };
    
    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    const prevImage = () => {
        currentImgIndex = (currentImgIndex - 1 + activeImages.length) % activeImages.length;
        showLightbox(currentImgIndex);
    };
    
    const nextImage = () => {
        currentImgIndex = (currentImgIndex + 1) % activeImages.length;
        showLightbox(currentImgIndex);
    };
    
    // Gallery Item click triggers Lightbox
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            updateActiveImages();
            const index = activeImages.indexOf(item);
            if (index !== -1) {
                showLightbox(index);
            }
        });
    });
    
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', prevImage);
    lightboxNext.addEventListener('click', nextImage);
    
    // Close on overlay click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    });

    // ----------------------------------------------------
    // 5. Anniversary D-Day Tracker
    // ----------------------------------------------------
    const familyAnniversaries = [
        { title: '엄마 생신 🎂', month: 8, day: 25 },
        { title: '부모님 결혼기념일 💍', month: 10, day: 12 },
        { title: '아빠 생신 🎉', month: 11, day: 20 },
        { title: '크리스마스 홈 파티 🎄', month: 12, day: 25 }
    ];
    
    const calculateNextEvent = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        let closestEvent = null;
        let minDaysDiff = Infinity;
        
        familyAnniversaries.forEach(event => {
            let eventDate = new Date(currentYear, event.month - 1, event.day);
            
            // If the event has already passed this year, set it to next year
            if (eventDate < today && (eventDate.getDate() !== today.getDate() || eventDate.getMonth() !== today.getMonth())) {
                eventDate.setFullYear(currentYear + 1);
            }
            
            // Reset hours for accurate date difference
            const tempToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const daysDiff = Math.ceil((eventDate - tempToday) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < minDaysDiff) {
                minDaysDiff = daysDiff;
                closestEvent = {
                    title: event.title.split(' ')[0], // Only primary name
                    fullTitle: event.title,
                    dateStr: `${eventDate.getFullYear()}년 ${String(event.month).padStart(2, '0')}월 ${String(event.day).padStart(2, '0')}일`,
                    daysRemaining: daysDiff
                };
            }
        });
        
        // Update DOM
        if (closestEvent) {
            document.getElementById('nextDDayTitle').textContent = closestEvent.fullTitle;
            document.getElementById('nextDDayDate').textContent = closestEvent.dateStr;
            
            const countdownEl = document.getElementById('ddayCountdown');
            if (closestEvent.daysRemaining === 0) {
                countdownEl.textContent = 'D-Day! 🎉';
                countdownEl.style.fontSize = '2.5rem';
            } else {
                countdownEl.textContent = `D-${closestEvent.daysRemaining}`;
                countdownEl.style.fontSize = '';
            }
        }
    };
    
    calculateNextEvent();

    // ----------------------------------------------------
    // 6. Guestbook (Rolling Paper / Board)
    // ----------------------------------------------------
    const guestbookForm = document.getElementById('guestbookForm');
    const guestNameInput = document.getElementById('guestName');
    const guestMessageInput = document.getElementById('guestMessage');
    const guestbookBoard = document.getElementById('guestbookBoard');
    
    const loadPostits = () => {
        guestbookBoard.innerHTML = '';
        const savedMessages = JSON.parse(localStorage.getItem('family_messages') || '[]');
        
        // Default messages if board is empty
        if (savedMessages.length === 0) {
            const defaultMsgs = [
                { id: 1, name: '아빠', message: '언제나 서로 힘이 되어주는 예쁜 우리 가족, 사랑한다! ❤️', color: 'pink', date: '2026. 7. 18.', rot: -2 },
                { id: 2, name: '엄마', message: '오늘 하루도 힘내고, 집에 올 때 조심히 들어오렴. 따뜻한 저녁 해둘게~', color: 'yellow', date: '2026. 7. 18.', rot: 1.5 },
                { id: 3, name: '첫째', message: '이번 주말에 다 같이 한강 갈 사람 구함! 맛있는 거 돗자리 펴고 먹자아 ✨', color: 'green', date: '2026. 7. 18.', rot: -1 }
            ];
            localStorage.setItem('family_messages', JSON.stringify(defaultMsgs));
            loadPostits();
            return;
        }
        
        savedMessages.forEach(msg => {
            const cardColorVar = `var(--postit-${msg.color})`;
            const postit = document.createElement('div');
            postit.className = `postit-note`;
            postit.style.setProperty('--note-color', cardColorVar);
            postit.style.setProperty('--rotation', `${msg.rot || 0}deg`);
            
            postit.innerHTML = `
                <div class="postit-note-body">${escapeHtml(msg.message)}</div>
                <div class="postit-note-footer">
                    <span class="postit-author">${escapeHtml(msg.name)}</span>
                    <span class="postit-date">${msg.date}</span>
                    <button class="btn-delete-postit" data-id="${msg.id}" aria-label="삭제">&times;</button>
                </div>
            `;
            
            // Delete postit handler
            postit.querySelector('.btn-delete-postit').addEventListener('click', (e) => {
                const idToDelete = parseInt(e.target.getAttribute('data-id'));
                deletePostit(idToDelete);
            });
            
            guestbookBoard.appendChild(postit);
        });
    };
    
    const deletePostit = (id) => {
        let messages = JSON.parse(localStorage.getItem('family_messages') || '[]');
        messages = messages.filter(m => m.id !== id);
        localStorage.setItem('family_messages', JSON.stringify(messages));
        loadPostits();
    };
    
    const savePostit = (name, message, color) => {
        const messages = JSON.parse(localStorage.getItem('family_messages') || '[]');
        const today = new Date();
        const dateStr = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}.`;
        
        // Random rotation between -3 and 3 degrees for realism
        const rotation = (Math.random() * 6 - 3).toFixed(1);
        
        const newMsg = {
            id: Date.now(),
            name,
            message,
            color,
            date: dateStr,
            rot: parseFloat(rotation)
        };
        
        messages.push(newMsg);
        localStorage.setItem('family_messages', JSON.stringify(messages));
        loadPostits();
    };
    
    guestbookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = guestNameInput.value.trim();
        const message = guestMessageInput.value.trim();
        const selectedColorEl = document.querySelector('input[name="cardColor"]:checked');
        const color = selectedColorEl ? selectedColorEl.value : 'yellow';
        
        if (name && message) {
            savePostit(name, message, color);
            // Reset form
            guestbookForm.reset();
            // Maintain pink check as default
            document.querySelector('input[name="cardColor"][value="pink"]').checked = true;
        }
    });
    
    // HTML Escape Helper to prevent XSS in client guestbook
    const escapeHtml = (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    };
    
    // Initial Load of postits
    loadPostits();
});
