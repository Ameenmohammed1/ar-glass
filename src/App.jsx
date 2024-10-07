import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'

function App() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [responseData, setResponseData] = useState({
        date: "2024-10-07 15:45:30",
        question: "What is the object in front of the camera?",
        description: "The object in front of the camera is a tree. It's a pine tree based on the shape and characteristics seen in the image.",
    }); // To store API response data
    const [isListening, setIsListening] = useState(false);
    const [speechRecognition, setSpeechRecognition] = useState(null);

    // Set up speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true; // Keep listening continuously
            recognition.interimResults = false; // Only get final results
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true); // Update state when recognition starts
            };

            recognition.onresult = (event) => {
                const transcript = event.results[event.resultIndex][0].transcript.toLowerCase();
                console.log('Transcript:', transcript);

                // If the transcript includes "Alex", extract the question after "Alex"
                if (transcript.includes('alex')) {
                    const question = transcript.replace('alex', '').trim(); // Remove "Alex" and get the question
                    if (question) {
                        captureImage(question); // Call captureImage with the extracted question
                    }
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error); // Log any errors
            };

            setSpeechRecognition(recognition); // Set the recognition instance in the state
        } else {
            console.log("Speech recognition not supported in this browser");
        }
    }, []);

    // Start the camera when the component mounts
    useEffect(() => {
        startCamera(); // Automatically start the camera when the app is loaded
    }, []);

    // Function to start the video stream from the user's back camera
    const startCamera = () => {
        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { exact: 'environment' } // 'environment' specifies the back camera
            }
        })
        .then(stream => {
            videoRef.current.srcObject = stream; // Set the video source to the user's camera stream
            videoRef.current.play(); // Play the video
        })
        .catch(err => {
            console.error("Error accessing the camera", err); // Log any errors
        });
    };

    // Function to capture an image from the video feed and send it to the backend
    const captureImage = (question) => {
        const context = canvasRef.current.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height); // Draw the current video frame on the canvas
        const imageData = canvasRef.current.toDataURL('image/jpeg'); // Convert the canvas to a JPEG data URL

        // Send the image and the question to the backend API for analysis
        axios.post('http://localhost:8000/api/analyze-image/', { image: imageData, question: question })
            .then(response => {
                // Store the response data (e.g., date and description) from the API
                setResponseData({
                    date: response.data.date,
                    question: question,
                    description: response.data.description
                });
            })
            .catch(error => {
                console.error("Error sending image to the backend", error); // Log any errors
            });
    };

    // Toggle speech recognition on or off
    const toggleListening = () => {
        if (isListening) {
            speechRecognition.stop(); // Stop listening
            setIsListening(false); // Update the state to reflect that listening has stopped
        } else {
            speechRecognition.start(); // Start listening for voice input
        }
    };

    return (
        <div className='mainCanvas'>
            <video ref={videoRef} className='camera' autoPlay />
            {/* Hidden canvas to capture the image */}
            <canvas ref={canvasRef} className='camera' style={{ display: 'none' }} />

            {/* Button to toggle speech recognition */}
            {/* <div>
                <button onClick={toggleListening}>
                    {isListening ? 'Stop Listening' : 'Start Listening'}
                </button>
            </div> */}

            {/* Display response data from the backend */}
            {responseData.description && (
                <div className="overlay">
                    <p>Date: {responseData.date}</p>
                    <p>You asked: {responseData.question}</p>
                    <p>Response: {responseData.description}</p>
                </div>
            )}
        </div>
    );
}

export default App;
