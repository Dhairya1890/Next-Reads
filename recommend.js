// Google Books API integration for book recommendations
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

// Debug flag - set to true to see detailed logs
const DEBUG = true;

// Function to log debug messages
function debugLog(message, data = null) {
  if (DEBUG) {
    if (data) {
      console.log(`[DEBUG] ${message}:`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

// Function to construct search query based on user preferences
function constructSearchQuery(genre, mood, purpose) {
  let query = '';
  
  // Add genre-specific terms
  if (genre) {
    query += `subject:${genre} `;
  }

  // Add mood-specific terms
  if (mood) {
    const moodTerms = {
      'happy': 'feel-good OR uplifting OR inspiring',
      'sad': 'emotional OR poignant OR moving',
      'energetic': 'action OR adventure OR thrilling',
      'calm': 'peaceful OR relaxing OR gentle',
      'thoughtful': 'philosophical OR deep OR meaningful',
      'adventurous': 'adventure OR exciting OR thrilling'
    };
    if (moodTerms[mood]) {
      query += `(${moodTerms[mood]}) `;
    }
  }

  // Add purpose-specific terms
  if (purpose) {
    const purposeTerms = {
      'entertainment': 'bestseller OR popular OR engaging',
      'learning': 'educational OR informative OR academic',
      'inspiration': 'motivational OR inspiring OR uplifting',
      'relaxation': 'light OR easy OR relaxing',
      'personal-growth': 'self-help OR development OR growth'
    };
    if (purposeTerms[purpose]) {
      query += `(${purposeTerms[purpose]}) `;
    }
  }

  // If no specific criteria were provided, use a default query
  if (!query) {
    query = 'subject:fiction OR subject:non-fiction';
  }

  // Add language filter but remove the strict quality filters
  query += 'inLanguage:en';

  return query.trim();
}

// Function to get book recommendations based on user preferences
async function getBookRecommendations(genre, mood, purpose) {
  debugLog('Getting book recommendations', { genre, mood, purpose });
  
  try {
    // Construct the search query
    const query = constructSearchQuery(genre, mood, purpose);
    debugLog('Constructed search query', query);

    // Make the API request with enhanced parameters
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&maxResults=20&orderBy=relevance`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || 
        `API request failed with status ${response.status}. Please try again later.`
      );
    }
    
    const data = await response.json();
    debugLog('Received API response', data);

    if (!data.items || data.items.length === 0) {
      throw new Error('No books found matching your preferences. Try adjusting your selections.');
    }

    // Process and filter the results - less strict filtering
    const recommendations = data.items
      .filter(book => {
        // Ensure book has at least a title and author
        const hasRequiredInfo = book.volumeInfo && 
                               book.volumeInfo.title && 
                               book.volumeInfo.authors;
        
        if (!hasRequiredInfo) {
          debugLog('Skipping book due to missing required info', book);
        }
        
        return hasRequiredInfo;
      })
      .map(book => {
        try {
          return {
            title: book.volumeInfo.title,
            author: book.volumeInfo.authors[0],
            description: book.volumeInfo.description || 'No description available.',
            imageUrl: book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x196?text=No+Cover',
            rating: book.volumeInfo.averageRating || 0,
            ratingsCount: book.volumeInfo.ratingsCount || 0,
            categories: book.volumeInfo.categories || [],
            previewLink: book.volumeInfo.previewLink,
            infoLink: book.volumeInfo.infoLink
          };
        } catch (error) {
          debugLog('Error processing book data', { book, error });
          return null;
        }
      })
      .filter(book => book !== null) // Remove any books that failed to process
      .sort((a, b) => {
        // Sort by rating and number of ratings
        const scoreA = (a.rating * 0.7) + (Math.min(a.ratingsCount / 1000, 1) * 0.3);
        const scoreB = (b.rating * 0.7) + (Math.min(b.ratingsCount / 1000, 1) * 0.3);
        return scoreB - scoreA;
      });

    if (recommendations.length === 0) {
      throw new Error('No suitable books found. Please try different preferences.');
    }

    debugLog('Processed recommendations', recommendations);
    return recommendations;

  } catch (error) {
    debugLog('Error getting recommendations', error);
    throw error;
  }
}

// Function to display book recommendations
function displayBookRecommendations(recommendations) {
  const container = document.getElementById('recommendations-container');
  if (!container) {
    console.error('Recommendations container not found');
    return;
  }

  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <h4>No Recommendations Found</h4>
        <p>Try adjusting your preferences to find books that match your interests.</p>
      </div>`;
    return;
  }

  const recommendationsHTML = recommendations.map(book => {
    try {
      return `
        <div class="book-card">
          <img src="${book.imageUrl}" alt="${book.title}" class="book-cover" 
               onerror="this.src='https://via.placeholder.com/128x196?text=No+Cover'">
          <div class="book-info">
            <h3>${book.title}</h3>
            <p class="author">by ${book.author}</p>
            <div class="rating">
              ${generateStarRating(book.rating)}
              <span class="ratings-count">(${book.ratingsCount} ratings)</span>
            </div>
            <p class="description">${book.description.substring(0, 150)}...</p>
            <div class="book-actions">
              ${book.previewLink ? `<a href="${book.previewLink}" target="_blank" class="btn btn-outline-primary">Preview</a>` : ''}
              ${book.infoLink ? `<a href="${book.infoLink}" target="_blank" class="btn btn-primary">Learn More</a>` : ''}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error generating HTML for book', { book, error });
      return '';
    }
  }).join('');

  container.innerHTML = recommendationsHTML || `
    <div class="alert alert-warning">
      <h4>Display Error</h4>
      <p>There was an error displaying the recommendations. Please try again.</p>
    </div>`;
}

// Helper function to generate star rating HTML
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

// Export functions for use in other files
window.getBookRecommendations = getBookRecommendations;
window.displayBookRecommendations = displayBookRecommendations;

// Log that the script has loaded
debugLog('recommend.js script loaded successfully');
