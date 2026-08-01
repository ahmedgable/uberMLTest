document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Car Price Predictor Started");

    loadOptions();

    // الاستماع للتغيير في الماركة لتحديث الموديل ديناميكياً
    const mfgSelect = document.getElementById("Manufacturer");
    if (mfgSelect) {
        mfgSelect.addEventListener("change", onManufacturerChange);
    }

    document.getElementById("predictionForm").addEventListener("submit", predictPrice);
});

async function loadOptions() {
    try {
        console.log("📡 Loading car options...");
        const response = await fetch("/options");

        if (!response.ok) {
            throw new Error("Failed to connect to /options");
        }

        const data = await response.json();

        if (data.status !== "success") {
            throw new Error(data.message);
        }

        const options = data.options;

        fillSelect("Manufacturer", options["Manufacturer"], "Select Manufacturer");
        fillSelect("Model", [], "Select Manufacturer First");
        fillSelect("Category", options["Category"], "Select Category");
        fillSelect("Fuel type", options["Fuel type"], "Select Fuel Type");
        fillSelect("Color", options["Color"], "Select Color");
        fillSelect("Leather interior", options["Leather interior"], "Select");
        fillSelect("Wheel", options["Wheel"], "Select");
        fillSelect("Gear box type", options["Gear box type"], "Select");
        fillSelect("Drive wheels", options["Drive wheels"], "Select");

        console.log("🎉 Options loaded successfully!");
    } catch (error) {
        console.error("❌ Loading Error:", error);
        showError("Unable to load car options. Please make sure Flask is running.");
    }
}

async function onManufacturerChange() {
    const manufacturer = this.value;
    const modelSelect = document.getElementById("Model");

    if (!manufacturer) {
        fillSelect("Model", [], "Select Manufacturer First");
        return;
    }

    modelSelect.innerHTML = '<option value="" disabled selected>⏳ Loading models...</option>';

    try {
        const response = await fetch(`/models-by-manufacturer/${encodeURIComponent(manufacturer)}`);
        const data = await response.json();

        if (data.status === "success" && data.models) {
            fillSelect("Model", data.models, "Select Model");
        } else {
            fillSelect("Model", [], "No models found");
        }
    } catch (error) {
        console.error("❌ Error loading models:", error);
        fillSelect("Model", [], "Error loading models");
    }
}

function fillSelect(id, values, placeholder) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = "";

    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = placeholder;
    firstOption.disabled = true;
    firstOption.selected = true;
    select.appendChild(firstOption);

    values.forEach(function (value) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

async function predictPrice(event) {
    event.preventDefault();
    hideError();

    const button = document.getElementById("predictButton");
    const loading = document.getElementById("loading");

    button.disabled = true;
    button.textContent = "⏳ Predicting...";
    loading.classList.remove("hidden");

    const data = {
        "Manufacturer": getValue("Manufacturer"),
        "Model": getValue("Model"),
        "Category": getValue("Category"),
        "Fuel type": getValue("Fuel type"),
        "Color": getValue("Color"),
        "Engine volume": Number(getValue("Engine volume")),
        "Mileage": Number(getValue("Mileage")),
        "Cylinders": Number(getValue("Cylinders")),
        "age": Number(getValue("age")),
        "Leather interior": getValue("Leather interior"),
        "Wheel": getValue("Wheel"),
        "Gear box type": getValue("Gear box type"),
        "Drive wheels": getValue("Drive wheels")
    };

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status !== "success") {
            throw new Error(result.message || "Prediction failed");
        }

        const price = result.prediction.price;

        document.getElementById("predictedPrice").textContent = "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2 });

        setText("resultManufacturer", data.Manufacturer);
        setText("resultModel", data.Model);
        setText("resultCategory", data.Category);
        setText("resultFuel", data["Fuel type"]);
        setText("resultEngine", data["Engine volume"] + " L");
        setText("resultMileage", data.Mileage.toLocaleString() + " km");

        document.getElementById("result").classList.remove("hidden");

        loadCarImage(data.Manufacturer, data.Model);

        document.getElementById("result").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
        console.error("❌ Prediction Error:", error);
        showError("Prediction failed: " + error.message);
    } finally {
        button.disabled = false;
        button.textContent = "🔮 Predict Car Price";
        loading.classList.add("hidden");
    }
}

async function loadCarImage(manufacturer, model) {
    const wrapper = document.getElementById("carImageWrapper");
    const imgLoading = document.getElementById("carImageLoading");
    const imgElement = document.getElementById("carImage");

    wrapper.classList.add("hidden");
    imgElement.src = "";
    imgLoading.classList.remove("hidden");

    const query = encodeURIComponent(`${manufacturer} ${model} car`);
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${query}&gsrlimit=1&prop=imageinfo&iiprop=url&format=json&origin=*`;

    try {
        const response = await fetch(wikiUrl);
        const result = await response.json();
        const pages = result?.query?.pages;

        if (pages) {
            const firstPage = Object.values(pages)[0];
            const imageUrl = firstPage?.imageinfo?.[0]?.url;
            if (imageUrl) {
                imgElement.src = imageUrl;
                imgElement.alt = `${manufacturer} ${model}`;
                wrapper.classList.remove("hidden");
                imgLoading.classList.add("hidden");
                return;
            }
        }
        throw new Error("No image on Wikimedia");
    } catch (error) {
        console.warn("⚠️ Wikimedia search failed, using fallback image:", error.message);
        // التوجيه لصورة احتياطية في حالة عدم توفر صورة محددة على ويكيميديا
        imgElement.src = `https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80`;
        imgElement.alt = `${manufacturer} ${model}`;
        wrapper.classList.remove("hidden");
    } finally {
        imgLoading.classList.add("hidden");
    }
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showError(message) {
    const error = document.getElementById("error");
    error.textContent = "❌ " + message;
    error.classList.remove("hidden");
}

function hideError() {
    const error = document.getElementById("error");
    error.classList.add("hidden");
}