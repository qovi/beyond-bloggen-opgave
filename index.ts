interface Recipe {
	name: string;
	description: string;
	ingredients: string;
	instructions: string;
}

interface RecipeComment {
	author: string;
	text: string;
	date: string;
}

type RecipeComments = Record<string, RecipeComment[]>;

const recipeList = document.getElementById("recipe-list");
const button = document.getElementById("recipe-form-button") as HTMLButtonElement | null;
const recipeCards = document.getElementById("recipe-cards");
const recipeForm = document.getElementById("recipe-form") as HTMLFormElement | null;
const commentModal = document.getElementById("comment-modal") as HTMLElement | null;
const commentsList = document.getElementById("comments-list") as HTMLElement | null;
const commentForm = document.getElementById("comment-form") as HTMLFormElement | null;
const closeModal = document.querySelector(".close-modal") as HTMLElement | null;
const filterName = document.getElementById("filter-name") as HTMLInputElement | null;

let recipes: Recipe[] = JSON.parse(localStorage.getItem("recipes") || "[]");
let comments: RecipeComments = JSON.parse(localStorage.getItem("comments") || "{}");
let currentRecipeIndex: number | null = null;

const addIngredientBtn = document.getElementById("add-ingredient") as HTMLButtonElement | null;
const ingredientsContainer = document.getElementById("ingredients-container") as HTMLElement | null;

function renderRecipeCards(): void {
	if (!recipeCards) return;
	recipeCards.innerHTML = "";
	let filteredRecipes = recipes;
	if (filterName && filterName.value.trim() !== "") {
		const filterValue = filterName.value.toLowerCase().trim();
		filteredRecipes = recipes.filter(recipe =>
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

		const recipeComments = comments[recipeIndex.toString()] ?? [];
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
                    <p>- ${recipe.ingredients.replace(/\n/g, "<br> - ")}</p>
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

	document.querySelectorAll(".delete-btn").forEach((btn) => {
		btn.addEventListener("click", (e: Event) => handleDelete(e));
	});

	document.querySelectorAll(".edit-btn").forEach((btn) => {
		btn.addEventListener("click", (e: Event) => handleEdit(e));
	});

	document.querySelectorAll(".comment-button").forEach((btn) => {
		btn.addEventListener("click", (e: Event) => openCommentModal(e));
	});
}

function addRecipe(name: string, description: string, ingredients: string, instructions: string): void {
	recipes.push({ name, description, ingredients, instructions });
	localStorage.setItem("recipes", JSON.stringify(recipes));
	renderRecipeCards();
}

function handleDelete(e: Event): void {
	const target = e.currentTarget as HTMLElement;
	const index = parseInt(target.dataset.index || "0");

	if (confirm("Er du sikker på, at du vil slette denne opskrift?")) {
		if (comments[index.toString()]) {
			delete comments[index.toString()];
			const newComments: RecipeComments = {};
			Object.keys(comments).forEach((key) => {
				const keyNum = parseInt(key);
				if (keyNum > index) {
					const commentsArr = comments[key];
					if (commentsArr) {
						newComments[(keyNum - 1).toString()] = [...commentsArr];
					}
				} else if (keyNum < index) {
					const commentsArr = comments[key];
					if (commentsArr) {
						newComments[key] = [...commentsArr];
					}
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

function handleEdit(e: Event): void {
	const target = e.currentTarget as HTMLElement;
	const index = parseInt(target.dataset.index || "0");
	const recipe = recipes[index];
    
	if (!recipe) return;
    
	const recipeNameInput = document.getElementById("recipe-name") as HTMLInputElement | null;
	const recipeDescriptionInput = document.getElementById("recipe-description") as HTMLInputElement | null;
	const recipeInstructionsInput = document.getElementById("recipe-instructions") as HTMLTextAreaElement | null;
	const recipeContainer = document.querySelector(".recipe-container");
	
	if (recipeNameInput && recipeDescriptionInput && recipeInstructionsInput && recipeContainer) {
		recipeNameInput.value = recipe.name;
		recipeDescriptionInput.value = recipe.description;
		populateIngredientRows(recipe.ingredients);
		recipeInstructionsInput.value = recipe.instructions;

		if (button) {
			button.textContent = "Opdater";
			button.dataset.editIndex = index.toString();

			recipeContainer.scrollIntoView({ behavior: "smooth" });
		}
	}
}

function openCommentModal(e: Event): void {
	const target = e.currentTarget as HTMLElement;
	const recipeIndex = parseInt(target.dataset.index || "0");
	currentRecipeIndex = recipeIndex;

	renderComments(recipeIndex);
	if (commentModal) commentModal.classList.add("show");
}

function renderComments(recipeIndex: number): void {
	if (!commentsList) return;
	commentsList.innerHTML = "";

	const recipeComments = comments[recipeIndex.toString()] ?? [];

	if (recipeComments.length === 0) {
		commentsList.innerHTML = '<p class="no-comments">Der er endnu ingen kommentarer til denne opskrift.</p>';
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

function closeCommentModal(): void {
	if (commentModal) commentModal.classList.remove("show");
	currentRecipeIndex = null;
	if (commentForm) commentForm.reset();
}

function addComment(recipeIndex: number, author: string, text: string): void {
	const indexKey = recipeIndex.toString();
	if (!comments[indexKey]) {
		comments[indexKey] = [];
	}

	comments[indexKey].push({
		author,
		text,
		date: new Date().toISOString(),
	});

	localStorage.setItem("comments", JSON.stringify(comments));
	renderComments(recipeIndex);
	renderRecipeCards();
}

if (recipeForm) {
	recipeForm.addEventListener("submit", (e: SubmitEvent) => {
		e.preventDefault();

		const nameInput = document.getElementById("recipe-name") as HTMLInputElement | null;
		const descriptionInput = document.getElementById("recipe-description") as HTMLInputElement | null;
		const instructionsInput = document.getElementById("recipe-instructions") as HTMLTextAreaElement | null;

		if (!nameInput || !instructionsInput) return;

		const name = nameInput.value;
		const description = descriptionInput ? descriptionInput.value : "";
		const ingredients = collectIngredients();
		const instructions = instructionsInput.value;

		if (name && ingredients && instructions) {
			if (button && button.dataset.editIndex !== undefined) {
				const index = parseInt(button.dataset.editIndex);
				recipes[index] = { name, description, ingredients, instructions };
				delete button.dataset.editIndex;
				button.textContent = "Gem";
			} else {
				addRecipe(name, description, ingredients, instructions);
			}

			recipeForm.reset();
			if (ingredientsContainer) {
				ingredientsContainer.innerHTML = `
					<div class="ingredient-row">
						<input type="text" class="ingredient-amount" placeholder="Mængde (fx 200g)" />
						<input type="text" class="ingredient-name" placeholder="Ingrediens (fx mel)" required />
						<button type="button" class="remove-ingredient">-</button>
					</div>
				`;
			}
			
			localStorage.setItem("recipes", JSON.stringify(recipes));
			renderRecipeCards();
		}
	});
}

if (commentForm) {
	commentForm.addEventListener("submit", (e: SubmitEvent) => {
		e.preventDefault();

		const authorInput = document.getElementById("comment-author") as HTMLInputElement | null;
		const textInput = document.getElementById("comment-text") as HTMLTextAreaElement | null;

		if (!authorInput || !textInput) return;

		const author = authorInput.value;
		const text = textInput.value;

		if (author && text && currentRecipeIndex !== null) {
			addComment(currentRecipeIndex, author, text);
			commentForm.reset();
		}
	});
}

if (closeModal) {
	closeModal.addEventListener("click", closeCommentModal);
}

window.addEventListener("click", (e: Event) => {
	if (e.target === commentModal) {
		closeCommentModal();
	}
});

if (filterName) {
	filterName.addEventListener("input", renderRecipeCards);
}

window.addEventListener("load", () => {
	setTimeout(() => {
		document.querySelectorAll(".recipe-card").forEach((card, i) => {
			setTimeout(() => {
				card.classList.add("fade-in");
			}, i * 100);
		});
	}, 300);
});

if (addIngredientBtn) {
	addIngredientBtn.addEventListener("click", addIngredientRow);
}

document.addEventListener("click", (e: Event) => {
	const target = e.target as HTMLElement;
	if (target && target.classList && target.classList.contains("remove-ingredient")) {
		if (document.querySelectorAll(".ingredient-row").length > 1) {
			const row = target.closest(".ingredient-row");
			if (row) row.remove();
		} else {
			alert("Der skal være mindst én ingrediens");
		}
	}
});

function addIngredientRow(): void {
	if (!ingredientsContainer) return;
	
	const row = document.createElement("div");
	row.className = "ingredient-row";
	row.innerHTML = `
        <input type="text" class="ingredient-amount" placeholder="Mængde (fx 200g)" />
        <input type="text" class="ingredient-name" placeholder="Ingrediens (fx mel)" required />
        <button type="button" class="remove-ingredient">-</button>
    `;
	ingredientsContainer.appendChild(row);
}

function collectIngredients(): string {
	const rows = document.querySelectorAll(".ingredient-row");
	const ingredients: string[] = [];
	
	rows.forEach(row => {
		const amountInput = row.querySelector(".ingredient-amount") as HTMLInputElement | null;
		const nameInput = row.querySelector(".ingredient-name") as HTMLInputElement | null;
		
		if (!amountInput || !nameInput) return;
		
		const amount = amountInput.value.trim();
		const name = nameInput.value.trim();
		
		if (name) {
			if (amount) {
				ingredients.push(`${amount} ${name}`);
			} else {
				ingredients.push(name);
			}
		}
	});

	return ingredients.join("\n");
}

function populateIngredientRows(ingredientsText: string): void {
	const rows = document.querySelectorAll(".ingredient-row");
	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];
		if (row) row.remove();
	}

	if (rows.length > 0) {
		const row = rows[0];
		if (!row) return;
		
		const amountInput = row.querySelector(".ingredient-amount") as HTMLInputElement | null;
		const nameInput = row.querySelector(".ingredient-name") as HTMLInputElement | null;
		
		if (amountInput) amountInput.value = "";
		if (nameInput) nameInput.value = "";
	}

	if (!ingredientsText) return;

	const ingredients = ingredientsText.split("\n");

	ingredients.forEach((ingredient, index) => {
		let row: Element | null = null;

		if (index === 0 && rows.length > 0) {
			const firstRow = rows[0];
			if (!firstRow) return;
			row = firstRow;
		} else {
			addIngredientRow();
			const allRows = document.querySelectorAll(".ingredient-row");
			if (index >= allRows.length) return;
			const currentRow = allRows[index];
			if (!currentRow) return;
			row = currentRow;
		}

		const parts = ingredient.trim().match(
			/^([\d.,\/\s]+\s*[a-zæøåA-ZÆØÅ]*)\s+(.+)$/
		);

		const amountInput = row.querySelector(".ingredient-amount") as HTMLInputElement | null;
		const nameInput = row.querySelector(".ingredient-name") as HTMLInputElement | null;
		
		if (!amountInput || !nameInput) return;

		if (parts && parts[1] && parts[2]) {
			amountInput.value = parts[1].trim();
			nameInput.value = parts[2].trim();
		} else {
			nameInput.value = ingredient.trim();
		}
	});
}

if (ingredientsContainer && ingredientsContainer.children.length === 0) {
	addIngredientRow();
}

renderRecipeCards();
