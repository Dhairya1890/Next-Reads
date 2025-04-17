// Featured books database with optimized image URLs
const featuredBooksDatabase = [
    {
        title: "The Midnight Library",
        author: "Matt Haig",
        image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg",
        rating: 4.5
    },
    {
        title: "Atomic Habits",
        author: "James Clear",
        image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg",
        rating: 5
    },
    {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1581527774i/41881472.jpg",
        rating: 5
    },
    {
        title: "Project Hail Mary",
        author: "Andy Weir",
        image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1597695864i/54493401.jpg",
        rating: 5
    },
    {
        title: "Tomorrow, and Tomorrow, and Tomorrow",
        author: "Gabrielle Zevin",
        image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1636978687i/58784475.jpg",
        rating: 4.5
    },
    {
        title: "Lessons in Chemistry",
        author: "Bonnie Garmus",
        image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1634748496i/58065033.jpg",
        rating: 4.5
    }
];

// Function to preload images
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = url;
    });
}

// Function to generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

// Function to get a deterministic random selection based on the date
function getDateBasedSelection(array, count) {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    let seed = Array.from(dateString).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Fisher-Yates shuffle with seeded random
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const rnd = seed / 233280;
        const j = Math.floor(rnd * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, count);
}

// Function to show loading state
function showLoadingState(container) {
    container.innerHTML = `
        <div class="featured-book loading">
            <div class="book-placeholder"></div>
        </div>
        <div class="featured-book loading">
            <div class="book-placeholder"></div>
        </div>
        <div class="featured-book loading">
            <div class="book-placeholder"></div>
        </div>
    `;
}

// Function to update featured books
async function updateFeaturedBooks() {
    const featuredContainer = document.querySelector('.featured-grid');
    if (!featuredContainer) return;

    // Show loading state
    showLoadingState(featuredContainer);

    const selectedBooks = getDateBasedSelection(featuredBooksDatabase, 3);
    
    try {
        // Preload all images first
        await Promise.all(selectedBooks.map(book => preloadImage(book.image)));
        
        const booksHTML = selectedBooks.map(book => `
            <div class="featured-book">
                <div class="book-image-container">
                    <img src="${book.image}" 
                         alt="${book.title}" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/200x300?text=Book+Cover';">
                </div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p class="author">by ${book.author}</p>
                    <div class="book-rating">
                        ${generateStarRating(book.rating)}
                    </div>
                </div>
            </div>
        `).join('');
        
        featuredContainer.innerHTML = booksHTML;
    } catch (error) {
        console.error('Error loading featured books:', error);
        featuredContainer.innerHTML = `
            <div class="alert alert-warning">
                <h4>Unable to load featured books</h4>
                <p>Please refresh the page to try again.</p>
            </div>
        `;
    }
}

// Initialize featured books when the DOM is loaded
document.addEventListener('DOMContentLoaded', updateFeaturedBooks); 