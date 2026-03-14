
import React, { useState, useEffect } from 'react';
import './LandingPage.css';

const LandingPage = ({ onStart }) => {
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [audioSource, setAudioSource] = useState('/landing-page/musics/normal-world.mpeg');
    const [videoSource, setVideoSource] = useState('/landing-page/videos/intro2.mp4');
    const [isIntroPlaying, setIsIntroPlaying] = useState(false);

    const switchTheme = () => {
        const nextIsDark = !isDarkTheme;
        setIsDarkTheme(nextIsDark);

        if (nextIsDark) {
            setVideoSource('/landing-page/videos/intro.mp4');
            setIsIntroPlaying(true);
        } else {
            setVideoSource('/landing-page/videos/intro2.mp4');
            setIsIntroPlaying(false);
        }

        const newTheme = nextIsDark ? 'dark-theme' : 'light-theme';
        const music = newTheme === 'light-theme' ? 'normal-world.mpeg' : 'inverted-world.mpeg';
        setAudioSource(`/landing-page/musics/${music}`);
    };

    useEffect(() => {
        const audio = document.getElementById('music');
        if (audio) {
            audio.volume = 0.2;
            audio.play().catch(e => console.log("Audio autoplay prevented"));
        }
    }, [audioSource]);

    return (
        <div className={`landing-page-root ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
            <header aria-label="Page header.">
                <audio id="music" autoPlay key={audioSource}>
                    <source src={audioSource} aria-details="Site Audio" />
                </audio>

                <video
                    autoPlay
                    muted
                    playsInline
                    className="hero-video-bg"
                    key={videoSource}
                    onLoadedData={(e) => {
                        // Only skip frames for the looping background
                        if (!isIntroPlaying) {
                            e.target.currentTime = 0.5;
                        }
                    }}
                    onEnded={(e) => {
                        // Videos freeze at their final frame when they end
                    }}
                >
                    <source src={videoSource} type="video/mp4" />
                </video>

                <div className="header-content">
                    <p className="invert-element" role="text">
                        Mr. Clarke has disappeared, leaving behind a collection of dense physics books
                        and radio manuals. The AV Club needs answers to understand the strange signals
                        appearing around Hawkins. Reading through hundreds of pages manually would
                        take too long. We need a tool that can summarize the complex physics of
                        the Upside Down automatically.
                    </p>
                    <div className="button-group">
                        <button id="switch-theme-button" onClick={switchTheme}>Go Upside Down</button>
                        <button id="dashboard-button" className="secondary-button" onClick={onStart}>Go to Dashboard</button>
                    </div>
                </div>
                <div id="top-characters" className="world-characters"></div>
            </header>

            <main>
                <div id="bottom-characters" className="world-characters"></div>
                <section id="section-inverted-world" className="container">
                    <div className="section-texts">
                        <h2>The Mystery of Mr. Clarke</h2>
                        <p role="text">
                            Our beloved science teacher left behind research notes that hold the key
                            to saving Hawkins. A simple text terminal isn't enough; the party needs
                            to visually brief the town sheriff and other allies using animated
                            presentation decks that simplify the multidimensional threats we face.
                        </p>
                    </div>
                    <img
                        className="invert-element"
                        src="/landing-page/images/content/inverted-world.png"
                        alt="Mr. Clarke's Research Site"
                    />
                </section>

                <section id="section-stranger-things-trailer" className="container">
                    <div className="video-frame" aria-hidden="true">
                        <img src="/landing-page/images/content/mr_clarke_lab.png" alt="Mr. Clarke's Science Lab" style={{ width: '100%', borderRadius: '8px' }} />
                    </div>
                    <div className="section-texts">
                        <h2>Mission Brief: The Engine</h2>
                        <p role="text">
                            Build an AI-powered engine that ingests documents and programmatically
                            generates fully formatted, animated presentation decks. The system must
                            intelligently chunk the retrieved data and outline a logical structure
                            with bullet points and visual animations.
                        </p>
                    </div>
                </section>

                <section id="section-stranger-things-gallery">
                    <div className="container section-text">
                        <h2>Core Project Objectives</h2>
                        <ul className="gallery-container" role="gallery">
                            <li className="gallery-image invert-element">
                                <img src="/landing-page/images/content/serie-image-01.png" alt="Ingest and Process Documents" />
                                <p>Ingest and process a local folder of reference documents including PDFs and text.</p>
                            </li>
                            <li className="gallery-image invert-element">
                                <img src="/landing-page/images/content/serie-image-02.png" alt="Automated Presentation Output" />
                                <p>Programmatically generate multi-slide animated presentation decks (HTML/PPTX).</p>
                            </li>
                            <li className="gallery-image invert-element">
                                <img src="/landing-page/images/content/serie-image-03.png" alt="Programmatic Animations" />
                                <p>Include automated slide transitions and sequential element animations.</p>
                            </li>
                        </ul>
                    </div>
                </section>

                <section id="section-form" className="container">
                    <h2>Join the AV Club Recruitment</h2>
                    <p>
                        To complete Project Directive 3, the AV Club needs your technical
                        expertise. If you have experience with AI, RAG systems, or programmatic
                        presentation generation, we have a spot for you in the party. Join us
                        to help find Mr. Clarke and stop the signals.
                    </p>

                    <div className="form-content">
                        <h3>Enter the AV Club and build tools from <span>another world</span></h3>

                        <div className="form-container">
                            <form>
                                <label htmlFor="txtName">Full Name</label>
                                <input type="text" name="name" id="txtName" />

                                <label htmlFor="txtEmail">Email</label>
                                <input type="email" name="email" id="txtEmail" />

                                <label htmlFor="txtLevel">Physics/Code Level</label>
                                <input type="text" name="level" id="txtLevel" />

                                <label htmlFor="txtCharacter">Your Role (e.g. Decoder, Builder)</label>
                                <textarea name="character" cols="30" rows="10" id="txtCharacter"></textarea>

                                <button type="button" id="btnSubscribe" onClick={onStart}>Join Project</button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <p>
                    Project Directive 3: A technical challenge built for the curiosity-driven.
                    Developed with HTML, CSS, and JavaScript.
                </p>
                <img src="/landing-page/images/footer/logo.svg" alt="DIO Logo" />
            </footer>
        </div>
    );
};

export default LandingPage;
