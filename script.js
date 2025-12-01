document.addEventListener('DOMContentLoaded', function() {
  // -------- ESTADO DO SISTEMA --------

// Tenta carregar o estado de login do localStorage. O padrão é 'false'.
// ====================================================================
// CONFIGURAÇÃO AWS (Inserir após document.addEventListener('DOMContentLoaded', function() {)
// ====================================================================

// 1. CONFIGURAÇÃO AWS GLOBAL (para Identity Pool e DynamoDB)
AWS.config.region = 'us-east-1'; // REGIÃO DO SEU PROJETO

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:3fb50d67-9e73-4d78-ac85-0ac84c3b775f', 
});

// 2. CONFIGURAÇÃO DO COGNITO USER POOL (para Login/Cadastro)
const poolData = {
    UserPoolId : 'us-east-1_Td4YZpRje',      
    ClientId : 'pikc5sit71vv0bv4j7g6oh73b'       
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider(); // Usado para Registro
const dynamodb = new AWS.DynamoDB.DocumentClient(); // Usado para Carrinho
// ====================================================================
// FIM DA CONFIGURAÇÃO AWS
// ====================================================================
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// Tenta carregar o carrinho do localStorage. O padrão é um array vazio.
let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const loginBtn = document.getElementById('loginBtn');
    const carrinhoBtn = document.getElementById('carrinhoBtn');
    const addToCartButtons = document.querySelectorAll('.btn-outline-danger');

    // Carrinho lateral
    const cartSection = document.getElementById("cart");
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout");

// Novo: Elemento para o contador de itens (badge)
    carrinhoBtn.setAttribute('data-count', cart.length);
    
    // ---------------------- FUNÇÃO DE SALVAMENTO ----------------------
    function saveState() {
        localStorage.setItem('isLoggedIn', isLoggedIn);
        // Transforma o array 'cart' em string antes de salvar
        localStorage.setItem('cart', JSON.stringify(cart));
        carrinhoBtn.setAttribute('data-count', cart.length);
        
        // Lógica para reabilitar/desabilitar o botão do carrinho na UI
        if (cart.length > 0 || isLoggedIn) {
            carrinhoBtn.classList.remove('disabled');
        } else {
            carrinhoBtn.classList.add('disabled');
        }
    }
  // -------- ATUALIZA UI --------
    function updateUI() {
        if (isLoggedIn) {
            loginBtn.textContent = 'Sair';
            carrinhoBtn.classList.remove('disabled');
        } else {
            loginBtn.textContent = 'Login/Cadastro';
            
            // O botão do carrinho só é desabilitado se não estiver logado E o carrinho estiver vazio
            if (cart.length === 0) {
                 carrinhoBtn.classList.add('disabled');
            }
        }
        // Salva o novo estado de login no localStorage
        saveState();
    }

    // ---------- RENDERIZA CARRINHO ----------
    function renderCart() {
        cartItems.innerHTML = "";
        let total = 0;

        cart.forEach((item, index) => {
            const li = document.createElement("li");
            li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

            li.innerHTML = `
                ${item.name} - R$ ${item.price.toFixed(2)}
                <button class="btn btn-sm btn-danger remove-item" data-index="${index}">X</button>
            `;

            cartItems.appendChild(li);
            total += item.price;
        });

        cartTotal.textContent = total.toFixed(2);
        // Salva o carrinho no localStorage após a renderização
        saveState();

        // Remover item
        document.querySelectorAll(".remove-item").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = e.target.dataset.index;
                cart.splice(index, 1);
                renderCart();
            });
        });
    }

    // -------- ABRIR/FECHAR CARRINHO --------
    carrinhoBtn.addEventListener("click", function(e) {
        if (!isLoggedIn) return;
        e.preventDefault();

        cartSection.style.right =
            cartSection.style.right === "0px" ? "-350px" : "0px";
    });

    // -------- BOTÕES "ADICIONAR AO CARRINHO" --------
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            if (!isLoggedIn) {
                alert('Por favor, faça login ou registre-se para adicionar itens ao carrinho.');
                const modalLogin = new bootstrap.Modal(document.getElementById('modalLogin'));
                modalLogin.show();
                return;
            }

            // Captura nome e preço dos atributos data-* do botão no HTML
            const name = this.dataset.name; 
            const price = parseFloat(this.dataset.price);

            cart.push({ name, price });
            renderCart();

            cartSection.style.right = "0px"; // abre automaticamente
        });
    });

    // -------- FINALIZAR COMPRA --------
    checkoutBtn.addEventListener("click", () => {
        if (!isLoggedIn) { // NOVO: Bloqueia se não estiver logado
             alert('Você precisa estar logado(a) para finalizar a compra.');
             const modalLogin = new bootstrap.Modal(document.getElementById('modalLogin'));
             modalLogin.show();
             return;
        }
        
        if (cart.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        alert("Compra finalizada! O total de R$ " + cartTotal.textContent + " será processado.");
        cart = [];
        renderCart();
        // O updateUI chama o saveState, garantindo que o carrinho vazio seja salvo
        updateUI(); 
    });

    // ---------- LOGIN E REGISTRO ----------
    const modalTitle = document.getElementById('modalLabelLogin');
    const nomeField = document.getElementById('nomeField');
    const submitBtn = document.getElementById('submitLoginBtn');
    const switchText = document.getElementById('switchFormText');
    const form = document.getElementById('loginForm');

    // Trocar para Registro
 // NOVO CÓDIGO (DELEGAÇÃO DE EVENTOS PARA TROCA DE FORMULÁRIO)

    // Função para mudar o modal para a tela de REGISTRO
    function setFormToRegister() {
        modalTitle.textContent = 'Registre-se';
        nomeField.style.display = 'block';
        submitBtn.textContent = 'Registrar';
        switchText.innerHTML = 'Já tem conta? <a href="#" id="switchToLogin">Faça Login</a>';
        form.reset();
    }

    // Função para mudar o modal para a tela de LOGIN
    function setFormToLogin() {
        modalTitle.textContent = 'Login';
        nomeField.style.display = 'none';
        submitBtn.textContent = 'Entrar';
        switchText.innerHTML = 'Não tem conta? <a href="#" id="switchToRegister">Registre-se</a>';
        form.reset();
    }
    
    // Delegação de Eventos: Captura cliques em qualquer lugar do documento.
    // Isso garante que o listener funcione mesmo se os links forem recriados.
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'switchToRegister') {
            e.preventDefault();
            setFormToRegister();
        } else if (e.target && e.target.id === 'switchToLogin') {
            e.preventDefault();
            setFormToLogin();
        }
    });

    // Certifica-se de que, se o botão "Sair" for clicado e o usuário estiver deslogado,
    // o formulário volte para o estado de LOGIN (caso tenha sido deixado em "Registro")
    document.getElementById('loginBtn').addEventListener('click', function() {
        if (!isLoggedIn) {
            setFormToLogin();
        }
    });

    // Se o modal for fechado por qualquer motivo, garante que volte para Login
    const modalLoginElement = document.getElementById('modalLogin');
    if (modalLoginElement) {
        modalLoginElement.addEventListener('hidden.bs.modal', setFormToLogin);
    }
    
    // Função unificada que determina para onde trocar
   

    // Simulação de login
    // NOVO CÓDIGO (COGNITO - LOGIN E REGISTRO)
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const senha = document.getElementById('loginSenha').value;

        if (!email || !senha) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        // --- LÓGICA DE REGISTRO (SIGN UP) ---
        if (submitBtn.textContent === 'Registrar') {
    
            const attributeList = [
                new AmazonCognitoIdentity.CognitoUserAttribute({
                    Name: 'email',
                    Value: email
                }),
            ];

            userPool.signUp(email, senha, attributeList, null, function(err, result) {
                form.reset();
                if (err) {
                    console.error("Erro no Registro:", err);
                    alert("Erro no Registro: " + err.message);
                    return;
                }
                
                // Se o registro for bem-sucedido:
                alert('Registro bem-sucedido! Verifique seu e-mail para confirmar a conta e faça login.');
                // Volta para a tela de Login
                document.getElementById('switchToLogin').click(); 
            });

        // --- LÓGICA DE LOGIN (SIGN IN) ---
        } else {
            const authenticationData = {
                Username: email,
                Password: senha,
            };
            const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

            const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
                Username: email,
                Pool: userPool
            });

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: function (result) {
                    
                    // 1. OBTEM O TOKEN DE IDENTIDADE
                    const idToken = result.getIdToken().getJwtToken();

                    // 2. FORNECE O TOKEN AO IDENTITY POOL
                    AWS.config.credentials.params.Logins = {};
                    AWS.config.credentials.params.Logins[
                        'cognito-idp.us-east-1.amazonaws.com/' + userPool.getUserPoolId()
                    ] = idToken;

                    // 3. ATUALIZA AS CREDENCIAIS AWS (IMPORTANTE para usar DynamoDB)
                    AWS.config.credentials.get(function(err) {
                        if (err) {
                            console.error("Erro ao obter credenciais AWS:", err);
                            alert("Erro ao obter credenciais AWS. Tente novamente.");
                            return;
                        }
                        
                        // Login bem-sucedido e credenciais AWS atualizadas!
                        form.reset();
                        alert('Login bem-sucedido! Bem-vindo(a)!');
                        isLoggedIn = true;
                        saveState();
                        updateUI();
                        
                        const modalLogin = bootstrap.Modal.getInstance(document.getElementById('modalLogin'));
                        if (modalLogin) modalLogin.hide();
                    });
                },
                onFailure: function(err) {
                    form.reset();
                    console.error("Erro no Login:", err);
                    alert("Erro no Login: " + err.message);
                },
                newPasswordRequired: function(userAttributes, requiredAttributes) {
                    form.reset();
                    alert("Sua senha precisa ser redefinida. Por favor, redefina sua senha.");
                }
            });
        }
    });

    // Logout
    loginBtn.addEventListener('click', function(e) {
        if (isLoggedIn) {
         e.preventDefault();
            isLoggedIn = false;
            // O carrinho não é mais limpado ao deslogar.
            updateUI(); // Chama o updateUI que salva o estado
            
            // Fecha o carrinho lateral
            cartSection.style.right = "-350px"; 
            
            alert('Você foi desconectado.');
        }
    });

    // ------- FORMULÁRIO DE CONTATO -------
    const contactForm = document.querySelector('#modalContato form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nome = document.getElementById('nome').value.trim();
            const email = document.getElementById('email').value.trim();
            const mensagem = document.getElementById('mensagem').value.trim();

            if (nome && email && mensagem) {
                alert('Mensagem enviada com sucesso! Obrigado pelo contato.');
                contactForm.reset();
                const modalElement = document.getElementById('modalContato');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            } else {
                alert('Por favor, preencha todos os campos.');
            }
        });
    }

    // ------- CAROUSEL HOVER -------
    const carousel = document.getElementById('carouselPromocoes');
    if (carousel) {
        carousel.addEventListener('mouseenter', function() {
            const bsCarousel = bootstrap.Carousel.getInstance(carousel);
            if (bsCarousel) bsCarousel.pause();
        });
        carousel.addEventListener('mouseleave', function() {
            const bsCarousel = bootstrap.Carousel.getInstance(carousel);
            if (bsCarousel) bsCarousel.cycle();
        });
    }

    // ------- SMOOTH SCROLL -------
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Inicializa a interface
    updateUI();
    renderCart();
});