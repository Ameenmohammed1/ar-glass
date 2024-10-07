import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [responseData, setResponseData] = useState({
        date: "2024-10-07 15:45:30",
        question: "What is the object in front of the camera?",
        description: "The object in front of the camera is a tree. It's a pine tree based on the shape and characteristics seen in the image."
    }); // To store API response data
    const [isListening, setIsListening] = useState(false);
    const [speechRecognition, setSpeechRecognition] = useState(null);
    const [isAlexDetected, setIsAlexDetected] = useState(false); // Track if "Alex" was detected
    const [capturedQuestion, setCapturedQuestion] = useState(''); // Store the question captured after "Alex"

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

                // Detect if "Alex" is mentioned
                if (transcript.includes('alex')) {
                    setIsAlexDetected(true); // Alex detected, start capturing the question
                    setCapturedQuestion(''); // Clear any previous question
                } 

                // Capture the question after "Alex" was detected
                if (isAlexDetected) {
                    const question = transcript.replace('alex', '').trim(); // Remove "Alex" and get the question
                    setCapturedQuestion(prev => prev + ' ' + question); // Add new transcript to the question
                }
            };

            recognition.onend = () => {
                setIsListening(false); // Update state when recognition ends
                if (isAlexDetected && capturedQuestion) {
                    // When the user stops speaking, process the captured question
                    captureImage(capturedQuestion);
                    setIsAlexDetected(false); // Reset Alex detection
                }
                recognition.start(); // Restart listening after ending (continuous mode)
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error); // Log any errors
            };

            setSpeechRecognition(recognition); // Set the recognition instance in the state
            recognition.start(); // Start recognition immediately
        } else {
            console.log("Speech recognition not supported in this browser");
        }
    }, [isAlexDetected, capturedQuestion]);

    // Start the camera when the component mounts
    useEffect(() => {
        startCamera(); // Automatically start the camera when the app is loaded
    }, []);

    // Function to start the video stream from the user's camera with higher resolution
    const startCamera = () => {
        const constraints = {
            video: {
                width: { ideal: 1920 }, // Ideal width for 1080p
                height: { ideal: 1080 }, // Ideal height for 1080p
                facingMode: 'environment' // Use 'environment' for the back camera
            }
        };

        navigator.mediaDevices.getUserMedia(constraints)
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
 alert(question)
        // Send the image and the question to the backend API for analysis
        // axios.post('http://localhost:8000/api/analyze-image/', { image: imageData, question })
        //     .then(response => {
        //         // Store the response data (e.g., date and description) from the API
        //         setResponseData({
        //             date: response.data.date,
        //             question: question,
        //             description: response.data.description
        //         });
        //     })
        //     .catch(error => {
        //         console.error("Error sending image to the backend", error); // Log any errors
        //     });
    };

    return (
        <div className='mainCanvac'>
           
           <video ref={videoRef} className='camera' autoPlay />
            {/* Hidden canvas to capture the image */}
            <canvas ref={canvasRef} className='camera' style={{ display: 'none' }} />
         
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
