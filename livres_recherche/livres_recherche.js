// Sélection des éléments du DOM
const searchBookInput = document.querySelector("#searchBook");
const searchButton = document.querySelector("#search");
const loadingElement = document.querySelector("#loading");
const errorElement = document.querySelector(".error");
const booksListElement = document.querySelector("#books");
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdown = document.querySelector('.dropdown');

// Ajout d'un élément pour le message de recherche
const searchMessageElement = document.createElement("p");
searchMessageElement.classList.add("search-message");
booksListElement.parentNode.insertBefore(searchMessageElement, booksListElement);

// Ajout d'un élément pour le nombre de résultats
const resultsCountElement = document.createElement("p");
resultsCountElement.classList.add("results-count");
booksListElement.parentNode.insertBefore(resultsCountElement, booksListElement);

// Afficher/masquer le menu déroulant des genres
dropdownToggle.addEventListener('click', function () {
    dropdown.classList.toggle('show');
});

// Fonction pour gérer la recherche d'un livre
searchButton.addEventListener('click', async function (event) {
    event.preventDefault();
    loadingElement.style.display = "block";
    errorElement.textContent = '';

    const searchBook = searchBookInput.value.trim();
    const selectedGenres = Array.from(document.querySelectorAll('.genre:checked'))
        .map(checkbox => checkbox.value);

    // Vérification des critères de recherche
    if (searchBook === '' && selectedGenres.length === 0) {
        errorElement.textContent = 'Vous devez entrer un titre ou sélectionner au moins un genre';
        loadingElement.style.display = "none"; // Masquer le message de chargement
    } else {
        // Construction de l'URL de l'API Google Books
        let apiUrl = 'https://www.googleapis.com/books/v1/volumes?q=';
        if (searchBook !== '') {
            apiUrl += encodeURIComponent(searchBook);
        }
        if (selectedGenres.length > 0) {
            apiUrl += (searchBook !== '' ? '+' : '') + 'subject:' + encodeURIComponent(selectedGenres.join('|'));
        }
        apiUrl += '&maxResults=40';

        let response;
        try {
            response = await fetch(apiUrl);
        } catch (error) {
            booksListElement.innerHTML = "";
            errorElement.textContent = `Vous n'êtes pas connecté à internet`;
            errorElement.style.display = "block";
            loadingElement.style.display = "none"; // Masquer le message de chargement
            // Nettoyer le formulaire même en cas d'erreur
            dropdown.classList.remove('show');
            const checkboxes = document.querySelectorAll('.genre:checked');
            checkboxes.forEach(checkbox => checkbox.checked = false);
            searchBookInput.value = '';
            return;
        }

        // Gestion des erreurs de réponse
        if (!response.ok) {
            const errorData = await response.json();
            errorElement.textContent = `Erreur ${response.status}: ${errorData.error.message}`;
            errorElement.style.display = "block";
            loadingElement.style.display = "none"; // Masquer le message de chargement
        } else {
            const result = await response.json();
            const books = result.items || []; // Définit books comme un tableau vide s'il n'y a pas de livres

            // Vérification si des livres ont été trouvés
            if (books.length === 0) {
                errorElement.textContent = 'Aucun livre trouvé pour cette recherche.';
                errorElement.style.display = "block";
                loadingElement.style.display = "none"; // Masquer le message de chargement
                searchMessageElement.textContent = ''; // Effacer le message de recherche
                resultsCountElement.textContent = ''; // Effacer le message du nombre de résultats
            } else {
                // Effacer la liste précédente
                booksListElement.innerHTML = "";

                // Construction du message de recherche
                let searchText = searchBook !== '' ? `Recherche : "${searchBook}"` : '';
                let genresText = selectedGenres.length > 0 ? `Genre(s) : ${selectedGenres.join(', ')}` : '';

                // Ajouter le séparateur " | " uniquement si les deux sont présents
                let combinedText = '';
                if (searchText && genresText) {
                    combinedText = `${searchText} | ${genresText}`;
                } else {
                    combinedText = searchText || genresText; // Prendre l'un ou l'autre s'il n'y a pas les deux
                }

                // Afficher le message de recherche
                searchMessageElement.textContent = combinedText.trim(); // Enlève les espaces inutiles
                resultsCountElement.textContent = `Nombre de résultats : ${books.length}`; // Affiche le nombre de résultats

                // Parcourt chaque livre retourné par l'API
                for (const book of books) {
                    const bookInfo = book.volumeInfo;
                    const bookCard = document.createElement("div");
                    bookCard.classList.add("book-card");

                    // Création de l'élément d'image <img> s'il y a une couverture
                    if (bookInfo.imageLinks && bookInfo.imageLinks.thumbnail) {
                        const imgElement = document.createElement("img");
                        imgElement.src = bookInfo.imageLinks.thumbnail;
                        imgElement.alt = `Couverture de ${bookInfo.title}`;
                        bookCard.appendChild(imgElement);
                    }

                    // Création de l'élément conteneur pour les informations du livre
                    const infoContainer = document.createElement("div");
                    infoContainer.classList.add("book-info");

                    // Création de l'élément de titre <h3>
                    const titleElement = document.createElement("h3");
                    titleElement.classList.add("book-title");
                    titleElement.textContent = bookInfo.title;

                    // Création d'un paragraphe pour l'auteur
                    const authors = bookInfo.authors ? bookInfo.authors.join(", ") : "Inconnu";
                    const authorElement = document.createElement("p");
                    authorElement.classList.add("book-author");
                    authorElement.textContent = `Auteur(s) : ${authors}`;

                    // Création d'un paragraphe pour le genre
                    const categories = bookInfo.categories ? bookInfo.categories.join(", ") : "Inconnu";
                    const genreElement = document.createElement("p");
                    genreElement.classList.add("book-genre");
                    genreElement.textContent = `Genre : ${categories}`;

                    // Création d'un paragraphe pour la date de publication
                    const dateElement = document.createElement("p");
                    dateElement.classList.add("book-date");
                    dateElement.textContent = `Date de parution : ${bookInfo.publishedDate || "Inconnue"}`;

                    // Création d'un conteneur pour la description
                    const shortSynopsis = bookInfo.description ? bookInfo.description.substring(0, 100) : "Aucune description disponible.";

                    // Création d'un paragraphe pour la description tronquée
                    const descriptionElement = document.createElement("p");
                    descriptionElement.classList.add("book-description");
                    descriptionElement.textContent = `${shortSynopsis}...`;

                    // Création du lien "Voir plus"
                    const toggleLink = document.createElement("a");
                    toggleLink.href = "#";
                    toggleLink.textContent = "Voir plus";
                    toggleLink.classList.add("toggle-synopsis-btn");

                    // Gestion du clic pour afficher ou masquer la description complète
                    toggleLink.addEventListener('click', function (e) {
                        e.preventDefault();
                        const fullDescription = bookInfo.description || "Aucune description disponible.";

                        if (toggleLink.textContent === "Voir plus") {
                            // Affiche la description complète
                            descriptionElement.textContent = fullDescription; // Remplace la description tronquée
                            toggleLink.textContent = "Voir moins"; // Change le texte du bouton

                            // Création des éléments supplémentaires
                            const publisherElement = document.createElement("p");
                            publisherElement.classList.add("additional-info");
                            publisherElement.textContent = `Éditeur : ${bookInfo.publisher || "Inconnu"}`;

                            const pageCountElement = document.createElement("p");
                            pageCountElement.classList.add("additional-info");
                            pageCountElement.textContent = `Nombre de pages : ${bookInfo.pageCount || "Inconnu"}`;

                            const averageRatingElement = document.createElement("p");
                            averageRatingElement.classList.add("additional-info");
                            averageRatingElement.textContent = `Note moyenne : ${bookInfo.averageRating || "Pas de note"}`;

                            const previewButton = document.createElement("button");
                            previewButton.textContent = "Aperçu";
                            previewButton.onclick = () => window.open(bookInfo.previewLink || "#", "_blank");
                            previewButton.classList.add("additional-info");
                            previewButton.classList.add("preview");

                            // Ajout des éléments supplémentaires au conteneur d'informations
                            infoContainer.appendChild(publisherElement);
                            infoContainer.appendChild(pageCountElement);
                            infoContainer.appendChild(averageRatingElement);
                            infoContainer.appendChild(descriptionElement);
                            infoContainer.appendChild(previewButton);
                            infoContainer.appendChild(toggleLink);
                        } else {
                            // Réinitialise la description tronquée
                            descriptionElement.textContent = `${shortSynopsis}...`;
                            toggleLink.textContent = "Voir plus"; // Remet le texte du bouton à "Voir plus"

                            // Supprime les éléments supplémentaires du conteneur d'informations
                            const additionalInfos = infoContainer.querySelectorAll('.additional-info');
                            additionalInfos.forEach(info => {
                                infoContainer.removeChild(info);
                            });
                        }
                    });

                    // Ajout des éléments créés au conteneur
                    infoContainer.appendChild(titleElement);
                    infoContainer.appendChild(authorElement);
                    infoContainer.appendChild(genreElement);
                    infoContainer.appendChild(dateElement);
                    infoContainer.appendChild(descriptionElement);
                    infoContainer.appendChild(toggleLink);

                    bookCard.appendChild(infoContainer);
                    booksListElement.appendChild(bookCard);
                }
            }
            loadingElement.style.display = "none"; // Assurez-vous de masquer le message de chargement ici aussi
        }
    }

    // Fermer le menu déroulant après la recherche
    dropdown.classList.remove('show');
    // Décocher les cases de genre
    const checkboxes = document.querySelectorAll('.genre:checked');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    searchBookInput.value = '';
});
