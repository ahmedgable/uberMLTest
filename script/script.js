document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "🚀 Car Price Predictor Started"
        );

        loadOptions();

        document
            .getElementById(
                "predictionForm"
            )
            .addEventListener(
                "submit",
                predictPrice
            );

    }
);


// ======================================================
// LOAD OPTIONS
// ======================================================

async function loadOptions() {

    try {

        console.log(
            "📡 Loading car options..."
        );


        const response = await fetch(
            "/options"
        );


        if (!response.ok) {

            throw new Error(
                "Failed to connect to /options"
            );

        }


        const data =
            await response.json();


        console.log(
            "✅ Options received:",
            data
        );


        if (
            data.status !==
            "success"
        ) {

            throw new Error(
                data.message
            );

        }


        const options =
            data.options;


        fillSelect(
            "Manufacturer",
            options["Manufacturer"],
            "Select Manufacturer"
        );


        fillSelect(
            "Model",
            options["Model"],
            "Select Model"
        );


        fillSelect(
            "Category",
            options["Category"],
            "Select Category"
        );


        fillSelect(
            "Fuel type",
            options["Fuel type"],
            "Select Fuel Type"
        );


        fillSelect(
            "Color",
            options["Color"],
            "Select Color"
        );


        fillSelect(
            "Leather interior",
            options["Leather interior"],
            "Select"
        );


        fillSelect(
            "Wheel",
            options["Wheel"],
            "Select"
        );


        fillSelect(
            "Gear box type",
            options["Gear box type"],
            "Select"
        );


        fillSelect(
            "Drive wheels",
            options["Drive wheels"],
            "Select"
        );


        console.log(
            "🎉 All dropdowns loaded!"
        );

    }


    catch (error) {

        console.error(
            "❌ Loading Error:",
            error
        );


        showError(
            "Unable to load car options. " +
            "Please make sure Flask is running."
        );

    }

}


// ======================================================
// FILL DROPDOWN
// ======================================================

function fillSelect(
    id,
    values,
    placeholder
) {

    const select =
        document.getElementById(
            id
        );


    if (!select) {

        console.error(
            "Element not found:",
            id
        );

        return;

    }


    select.innerHTML = "";


    const firstOption =
        document.createElement(
            "option"
        );


    firstOption.value = "";

    firstOption.textContent =
        placeholder;

    firstOption.disabled =
        true;

    firstOption.selected =
        true;


    select.appendChild(
        firstOption
    );


    values.forEach(
        function (value) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                value;

            option.textContent =
                value;


            select.appendChild(
                option
            );

        }
    );


    console.log(
        `✅ ${id}: ${values.length} options`
    );

}


// ======================================================
// PREDICT
// ======================================================

async function predictPrice(
    event
) {

    event.preventDefault();


    hideError();


    const button =
        document.getElementById(
            "predictButton"
        );


    const loading =
        document.getElementById(
            "loading"
        );


    button.disabled =
        true;


    button.textContent =
        "⏳ Predicting...";


    loading.classList.remove(
        "hidden"
    );


    const data = {

        "Manufacturer":
            getValue(
                "Manufacturer"
            ),

        "Model":
            getValue(
                "Model"
            ),

        "Category":
            getValue(
                "Category"
            ),

        "Fuel type":
            getValue(
                "Fuel type"
            ),

        "Color":
            getValue(
                "Color"
            ),

        "Engine volume":
            Number(
                getValue(
                    "Engine volume"
                )
            ),

        "Mileage":
            Number(
                getValue(
                    "Mileage"
                )
            ),

        "Cylinders":
            Number(
                getValue(
                    "Cylinders"
                )
            ),

        "age":
            Number(
                getValue(
                    "age"
                )
            ),

        "Leather interior":
            getValue(
                "Leather interior"
            ),

        "Wheel":
            getValue(
                "Wheel"
            ),

        "Gear box type":
            getValue(
                "Gear box type"
            ),

        "Drive wheels":
            getValue(
                "Drive wheels"
            )

    };


    console.log(
        "📤 Sending:",
        data
    );


    try {


        const response =
            await fetch(

                "/predict",

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            data
                        )

                }

            );


        const result =
            await response.json();


        console.log(
            "📥 Prediction:",
            result
        );


        if (
            result.status !==
            "success"
        ) {

            throw new Error(
                result.message ||
                "Prediction failed"
            );

        }


        const price =
            result.prediction.price;


        // Price

        document
            .getElementById(
                "predictedPrice"
            )
            .textContent =

            "$" +

            price.toLocaleString(
                "en-US",
                {

                    minimumFractionDigits:
                        2

                }
            );


        // Car Information

        setText(
            "resultManufacturer",
            data.Manufacturer
        );


        setText(
            "resultModel",
            data.Model
        );


        setText(
            "resultCategory",
            data.Category
        );


        setText(
            "resultFuel",
            data["Fuel type"]
        );


        setText(

            "resultEngine",

            data["Engine volume"] +
            " L"

        );


        setText(

            "resultMileage",

            data.Mileage.toLocaleString() +
            " km"

        );


        // Show Result

        document
            .getElementById(
                "result"
            )
            .classList
            .remove(
                "hidden"
            );


        // Load Real Car Image

        loadCarImage(
            data.Manufacturer,
            data.Model
        );


        // Scroll

        document
            .getElementById(
                "result"
            )
            .scrollIntoView({

                behavior:
                    "smooth"

            });


    }


    catch (error) {

        console.error(
            "❌ Prediction Error:",
            error
        );


        showError(
            "Prediction failed: " +
            error.message
        );

    }


    finally {

        button.disabled =
            false;


        button.textContent =
            "🔮 Predict Car Price";


        loading
            .classList
            .add(
                "hidden"
            );

    }

}


// ======================================================
// LOAD REAL CAR IMAGE (Wikimedia Commons - no API key needed)
// ======================================================

async function loadCarImage(
    manufacturer,
    model
) {

    const wrapper =
        document.getElementById(
            "carImageWrapper"
        );

    const imgLoading =
        document.getElementById(
            "carImageLoading"
        );

    const imgElement =
        document.getElementById(
            "carImage"
        );


    // Reset state

    wrapper.classList.add(
        "hidden"
    );

    imgElement.src = "";

    imgLoading.classList.remove(
        "hidden"
    );


    const query =
        encodeURIComponent(
            `${manufacturer} ${model} car`
        );


    const url =
        "https://commons.wikimedia.org/w/api.php" +
        "?action=query" +
        "&generator=search" +
        "&gsrnamespace=6" +
        `&gsrsearch=${query}` +
        "&gsrlimit=1" +
        "&prop=imageinfo" +
        "&iiprop=url" +
        "&format=json" +
        "&origin=*";


    try {

        console.log(
            "🖼️ Fetching car image for:",
            manufacturer,
            model
        );


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Image search request failed"
            );

        }


        const result =
            await response.json();


        const pages =
            result?.query?.pages;


        if (!pages) {

            throw new Error(
                "No image found"
            );

        }


        const firstPage =
            Object.values(
                pages
            )[0];


        const imageUrl =
            firstPage
                ?.imageinfo
                ?.[0]
                ?.url;


        if (!imageUrl) {

            throw new Error(
                "No image URL in response"
            );

        }


        imgElement.src =
            imageUrl;

        imgElement.alt =
            `${manufacturer} ${model}`;


        wrapper.classList.remove(
            "hidden"
        );


        console.log(
            "✅ Car image loaded"
        );

    }

    catch (error) {

        console.warn(
            "⚠️ Could not load car image:",
            error.message
        );

        // Silently skip the image if none is found,
        // the rest of the result still displays fine.

    }

    finally {

        imgLoading.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// GET VALUE
// ======================================================

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value
        : "";

}


// ======================================================
// SET TEXT
// ======================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ======================================================
// ERROR
// ======================================================

function showError(
    message
) {

    const error =
        document.getElementById(
            "error"
        );


    error.textContent =
        "❌ " + message;


    error.classList.remove(
        "hidden"
    );

}


function hideError() {

    const error =
        document.getElementById(
            "error"
        );


    error.classList.add(
        "hidden"
    );

}