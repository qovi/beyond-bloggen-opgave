const recipeList = document.getElementById("recipe-list");
const button = document.getElementById("recipe-form-button");
const recipeCards = document.getElementById("recipe-cards");
const recipeForm = document.getElementById("recipe-form");
const commentModal = document.getElementById("comment-modal");
const commentsList = document.getElementById("comments-list");
const commentForm = document.getElementById("comment-form");
const closeModal = document.querySelector(".close-modal");
const filterName = document.getElementById("filter-name");

let recipes = JSON.parse(localStorage.getItem("recipes")) || [];
let comments = JSON.parse(localStorage.getItem("comments")) || {};
let currentRecipeIndex = null;

function renderRecipeCards() {
	recipeCards.innerHTML = "";

	// Anvend filter hvis værdi er indtastet
	let filteredRecipes = recipes;
	if (filterName && filterName.value.trim() !== "") {
		const filterValue = filterName.value.toLowerCase().trim();
		filteredRecipes = recipes.filter((recipe) =>
			recipe.name.toLowerCase().includes(filterValue)
		);
	}

	if (filteredRecipes.length === 0) {
		recipeCards.innerHTML = `
            <div class="no-recipes">
                <p>${
					recipes.length > 0
						? "Ingen opskrifter matcher dit søgekriterie."
						: "Der er ingen opskrifter endnu. Opret din første opskrift ovenfor!"
				}</p>
            </div>
        `;
		return;
	}

	filteredRecipes.forEach((recipe, index) => {
		const recipeIndex = recipes.indexOf(recipe);
		const card = document.createElement("div");
		card.className = "recipe-card";

		// Tæl kommentarer for denne opskrift
		const recipeComments = comments[recipeIndex] || [];
		const commentCount = recipeComments.length;

		card.innerHTML = `
            <h3>${recipe.name}</h3>
            ${
				recipe.description
					? `<p class="recipe-description">${recipe.description.replace(
							/\n/g,
							"<br>"
					  )}</p>`
					: '<p class="recipe-no-description">Der er ikke en beskrivelse til denne opskrift.</p>'
			}
            
            <div class="recipe-details">
                <div class="recipe-section">
                    <h4>Ingredienser</h4>
                    <p>${recipe.ingredients.replace(/\n/g, "<br>")}</p>
                </div>
                
                <div class="recipe-section">
                    <h4>Fremgangsmåde</h4>
                    <p>${recipe.instructions.replace(/\n/g, "<br>")}</p>
                </div>
            </div>
            
            <div class="recipe-card-buttons">
                <button class="edit-btn" data-index="${recipeIndex}">Rediger</button>
                <button class="delete-btn" data-index="${recipeIndex}">Slet</button>
            </div>
            <button class="comment-button" data-index="${recipeIndex}">
                    Kommentarer
                    ${
						commentCount > 0
							? `<span class="comment-count">${commentCount}</span>`
							: ""
					}
                </button>
        `;

		recipeCards.appendChild(card);
	});

	// Tilføj event listeners til knapper
	document.querySelectorAll(".delete-btn").forEach((btn) => {
		btn.addEventListener("click", handleDelete);
	});

	document.querySelectorAll(".edit-btn").forEach((btn) => {
		btn.addEventListener("click", handleEdit);
	});

	document.querySelectorAll(".comment-button").forEach((btn) => {
		btn.addEventListener("click", openCommentModal);
	});
}

function addRecipe(name, description, ingredients, instructions) {
	recipes.push({ name, description, ingredients, instructions });
	localStorage.setItem("recipes", JSON.stringify(recipes));

	renderRecipeCards();
}

function handleDelete(e) {
	const index = parseInt(e.target.dataset.index);

	if (confirm("Er du sikker på, at du vil slette denne opskrift?")) {
		// Slet også opskriftens kommentarer
		if (comments[index]) {
			delete comments[index];

			// Opdater indeks i kommentarer efter sletning
			const newComments = {};
			Object.keys(comments).forEach((key) => {
				const keyNum = parseInt(key);
				if (keyNum > index) {
					newComments[keyNum - 1] = comments[key];
				} else if (keyNum < index) {
					newComments[keyNum] = comments[key];
				}
			});

			comments = newComments;
			localStorage.setItem("comments", JSON.stringify(comments));
		}

		recipes.splice(index, 1);
		localStorage.setItem("recipes", JSON.stringify(recipes));
		renderRecipeCards();
	}
}

function handleEdit(e) {
	const index = parseInt(e.target.dataset.index);
	const recipe = recipes[index];

	// Udfyld formularen med eksisterende data
	document.getElementById("recipe-name").value = recipe.name;
	document.getElementById("recipe-description").value = recipe.description;
	document.getElementById("recipe-ingredients").value = recipe.ingredients;
	document.getElementById("recipe-instructions").value = recipe.instructions;

	// Skift knappen til "Opdater"
	button.textContent = "Opdater";
	button.dataset.editIndex = index;

	// Scroll til formular
	document
		.querySelector(".recipe-container")
		.scrollIntoView({ behavior: "smooth" });
}

// Kommentar funktionalitet
function openCommentModal(e) {
	const recipeIndex = parseInt(e.target.dataset.index);
	currentRecipeIndex = recipeIndex;

	renderComments(recipeIndex);

	// Vis modal med animation
	commentModal.classList.add("show");
}

function renderComments(recipeIndex) {
	commentsList.innerHTML = "";

	const recipeComments = comments[recipeIndex] || [];

	if (recipeComments.length === 0) {
		commentsList.innerHTML =
			'<p class="no-comments">Der er endnu ingen kommentarer til denne opskrift.</p>';
		return;
	}

	recipeComments.forEach((comment) => {
		const commentEl = document.createElement("div");
		commentEl.className = "comment";

		const date = new Date(comment.date);
		const formattedDate = `${date.getDate()}/${
			date.getMonth() + 1
		}/${date.getFullYear()} ${date.getHours()}:${date
			.getMinutes()
			.toString()
			.padStart(2, "0")}`;

		commentEl.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${formattedDate}</span>
            </div>
            <div class="comment-text">${comment.text.replace(
				/\n/g,
				"<br>"
			)}</div>
        `;

		commentsList.appendChild(commentEl);
	});
}

function closeCommentModal() {
	commentModal.classList.remove("show");
	currentRecipeIndex = null;
	commentForm.reset();
}

function addComment(recipeIndex, author, text) {
	if (!comments[recipeIndex]) {
		comments[recipeIndex] = [];
	}

	comments[recipeIndex].push({
		author,
		text,
		date: new Date().toISOString(),
	});

	localStorage.setItem("comments", JSON.stringify(comments));
	renderComments(recipeIndex);
	renderRecipeCards(); // Opdater kortene for at vise kommentar tæller
}

// Event listeners
recipeForm.addEventListener("submit", (e) => {
	e.preventDefault();

	const name = document.getElementById("recipe-name").value;
	const description = document.getElementById("recipe-description").value;
	const ingredients = document.getElementById("recipe-ingredients").value;
	const instructions = document.getElementById("recipe-instructions").value;

	if (name && ingredients && instructions) {
		// Tjek om vi redigerer eller tilføjer
		if (button.dataset.editIndex !== undefined) {
			const index = parseInt(button.dataset.editIndex);
			recipes[index] = { name, description, ingredients, instructions };
			delete button.dataset.editIndex;
			button.textContent = "Gem";
		} else {
			addRecipe(name, description, ingredients, instructions);
		}

		// Nulstil formularen
		recipeForm.reset();
		localStorage.setItem("recipes", JSON.stringify(recipes));
		renderRecipeCards();
	}
});

commentForm.addEventListener("submit", (e) => {
	e.preventDefault();

	const author = document.getElementById("comment-author").value;
	const text = document.getElementById("comment-text").value;

	if (author && text && currentRecipeIndex !== null) {
		addComment(currentRecipeIndex, author, text);
		commentForm.reset();
	}
});

closeModal.addEventListener("click", closeCommentModal);

// Luk modal hvis der klikkes uden for indholdet
window.addEventListener("click", (e) => {
	if (e.target === commentModal) {
		closeCommentModal();
	}
});

// Filtrer opskrifter ved input
if (filterName) {
	filterName.addEventListener("input", renderRecipeCards);
}

// Tilføj animation til korterne når siden indlæses
window.addEventListener("load", () => {
	setTimeout(() => {
		document.querySelectorAll(".recipe-card").forEach((card, i) => {
			setTimeout(() => {
				card.classList.add("fade-in");
			}, i * 100);
		});
	}, 300);
});

renderRecipeCards();
