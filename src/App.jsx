import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [responseData, setResponseData] = useState();
    const [isListening, setIsListening] = useState(false);
    const [speechRecognition, setSpeechRecognition] = useState(null);
    const [wait,setWait]=useState(false);


    // Set up speech recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event) => {
                const transcript = event.results[event.resultIndex][0].transcript.toLowerCase();
                console.log('Transcript:', transcript);

                if(transcript == "close"){
                    setResponseData('')
                }
                
                        captureImage(transcript); // Capture the image and send question
                        recognition.stop(); // Stop listening
                        setIsListening(false);
                
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };

            setSpeechRecognition(recognition); // Save recognition instance
        } else {
            console.log("Speech recognition not supported in this browser");
        }
    }, []);

    // Start the camera when the component mounts
    useEffect(() => {
        startCamera(); // Automatically start the camera
    }, []);

    // Function to start the video stream from the user's camera
    const startCamera = () => {
        navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            //   facingMode: 'environment' 
            }
        })
        .then(stream => {
            videoRef.current.srcObject = stream;
            videoRef.current.play(); // Play the video stream
        })
        .catch(err => {
            console.error("Error accessing the camera", err);
        });
    };

    // Function to capture an image from the video feed
    const captureImage = (question) => {
        const context = canvasRef.current.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height); // Draw the video frame
        const imageData = canvasRef.current.toDataURL('image/jpeg'); // Convert the canvas to image data
        setWait(true)
        console.log('Captured question:', question);
        
        // Sending image and question to backend for analysis
        axios.post('http://localhost:8000/api/analyze-image/', { image: imageData, prompt: question })
            .then(response => {
                console.log(response);
                
                // Set the response data from the backend
                setResponseData( response?.data?.description );
            })
            .catch(error => {
                console.error("Error sending image to the backend", error);
            }).finally(()=>setWait(false))
    };

    // Toggle listening state
    const toggleListening = () => {
        
            setResponseData('')
            speechRecognition.start(); // Start listening
        
    };

    return (
        <div className='mainCanvas' onClick={toggleListening}>
            {/* Video Feed */}
            <video ref={videoRef} className='camera' autoPlay />
            
            {/* Hidden Canvas to capture video frame */}
            <canvas ref={canvasRef} className='camera' style={{ display: 'none' }} />
            
            {!responseData && isListening ?(<div className='overlay'>
               
                    {isListening ? 'Listening...' : ''}
               
            </div>):(<></>)}

{
    wait ? ( <p className='overlay'>Please Wait...</p>):(<></>)
}
           
            

            {/* Display response from the backend */}
            {responseData && (
                <div className="overlay">
                    <p>{responseData}</p>
                </div>
            )}
        </div>
    );
}

export default App;
