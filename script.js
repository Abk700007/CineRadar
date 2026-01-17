const API_KEY = "";

// Elements
const carousel = document.getElementById("carousel");
const popularMoviesDiv = document.getElementById("popularMovies");
const searchResultsDiv = document.getElementById("searchResults");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const modal = document.getElementById("reviewModal");
const closeBtn = document.querySelector(".closeBtn");
const modalMovieTitle = document.getElementById("modalMovieTitle");
const modalMoviePlot = document.getElementById("modalMoviePlot");
const reviewInput = document.getElementById("reviewInput");
const saveReviewBtn = document.getElementById("saveReviewBtn");
const savedReviewsDiv = document.getElementById("savedReviews");
const stars = document.querySelectorAll(".star");

let currentMovieID = "";
let currentRating = 0;

// --- Data ---
// Latest released movie IDs (sample)
const latestMovies = ["tt1630029","tt15398776","tt2953050","tt1745960","tt11214590","tt10648342","tt14444726","tt1520211"];
// Popular all-time movies IDs (12 movies)
const popularMovies = ["tt0111161","tt0068646","tt0071562","tt0468569","tt0050083","tt0108052","tt0167260","tt0110912","tt0060196","tt0137523","tt0120737","tt0109830"];

// --- Load homepage ---
window.onload = () => {
  // Load carousel
  latestMovies.forEach(id => fetchMovieByID(id, carousel, true));
  startCarousel();

  // Load popular grid
  popularMovies.forEach(id => fetchMovieByID(id, popularMoviesDiv, false));
};

// --- Search ---
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) {
    fetchSearchResults(query).then(() => {
      const searchSection = document.getElementById("searchSection");

      // Scroll so search results are at the very top
      const topPos = searchSection.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: topPos - 10,
        behavior: "smooth"
      });
    });
  }
});

async function fetchSearchResults(query) {
  try {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`);
    const data = await res.json();
    searchResultsDiv.innerHTML = "";
    if (data.Search) {
      data.Search.forEach(movie => fetchMovieByID(movie.imdbID, searchResultsDiv, false));
    } else {
      searchResultsDiv.innerHTML = "<p>No movies found.</p>";
    }
  } catch(err){ console.error(err);}
}

// --- Fetch by ID ---
async function fetchMovieByID(id, container, isCarousel=false){
  try{
    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=short`);
    const movie = await res.json();
    const card = document.createElement("div");
    card.className = isCarousel ? "carousel-item movie-card" : "movie-card";
    card.onclick = ()=> openModal(movie.imdbID);
    const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/200x300?text=No+Image";
    card.innerHTML = `
      <img src="${poster}" alt="${movie.Title}">
      <h3>${movie.Title}</h3>
      <p>${movie.Year}</p>
      ${!isCarousel ? `<p>${movie.Plot}</p>` : ""}
    `;
    container.appendChild(card);
  }catch(err){ console.error(err);}
}

// --- Carousel auto scroll ---
function startCarousel() {
  let scrollPos = 0;
  const speed = 0.5; // pixels per frame

  function scroll() {
    scrollPos += speed;
    if (scrollPos >= carousel.scrollWidth - carousel.clientWidth) scrollPos = 0;
    carousel.scrollLeft = scrollPos;
    requestAnimationFrame(scroll);
  }

  requestAnimationFrame(scroll);
}

// --- Modal ---
function openModal(id){
  currentMovieID = id;
  currentRating = 0;
  stars.forEach(star=>star.classList.remove("selected"));
  reviewInput.value = "";
  fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=short`)
    .then(r=>r.json())
    .then(movie=>{
      modalMovieTitle.innerText = movie.Title;
      modalMoviePlot.innerText = movie.Plot;
      displayReviews(id);
      modal.style.display = "flex";
    });
}

closeBtn.onclick = ()=> modal.style.display = "none";
window.onclick = e=>{if(e.target === modal) modal.style.display="none";}

// --- Star Rating ---
stars.forEach(star=>{
  star.addEventListener("click", ()=>{
    currentRating = parseInt(star.dataset.value);
    updateStars(currentRating);
  });
});
function updateStars(rating){
  stars.forEach(star=>{
    if(parseInt(star.dataset.value) <= rating) star.classList.add("selected");
    else star.classList.remove("selected");
  });
}

// --- Save Review ---
saveReviewBtn.onclick = ()=>{
  const reviewText = reviewInput.value;
  if(currentRating === 0 || !reviewText) { alert("Please give rating and review"); return;}
  let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
  if(!reviews[currentMovieID]) reviews[currentMovieID] = [];
  reviews[currentMovieID].push({rating: currentRating, review: reviewText});
  localStorage.setItem("reviews", JSON.stringify(reviews));
  displayReviews(currentMovieID);
  reviewInput.value = "";
  currentRating = 0;
  updateStars(0);
}

// --- Display Reviews ---
function displayReviews(id){
  let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
  savedReviewsDiv.innerHTML = "<h3>Reviews:</h3>";
  if(reviews[id]){
    reviews[id].forEach(r=>{
      savedReviewsDiv.innerHTML += `<p>⭐ ${r.rating}/5 - ${r.review}</p>`;
    });
  }else{
    savedReviewsDiv.innerHTML += "<p>No reviews yet.</p>";
  }
}
