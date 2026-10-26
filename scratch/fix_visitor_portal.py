with open('web/src/pages/visitor/VisitorPortal.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

bad_segment = """            const poiObj = {
                id: poi_,
                name: data.poiName,
                nameVi: data.poiName,
                imageUrl: data.imageUrl || '',
                scientificName: Điểm tham quan ()
            };
            const duration = data.durationSeconds || 60;
            const audioSource = data.streamUrl || data.audioUrl;
            const narrationData = {
                title: data.title || data.poiName,
                narrator: 'ZooGuide Audio',
                audioSrc: audioSource,
                publicUrl: data.audioUrl,
                streamUrl: data.streamUrl,
                content: data.content,
                transcript: data.content,
                durationFormatted: ${Math.floor(duration / 60)}:,
                durationSec: duration,
                hasAudio: Boolean(audioSource)
            };
            setAudioState({
                animal: poiObj,
                narration: narrationData,
                isPlaying: Boolean(audioSource && startAutoplay),
                currentTime: 0,
                duration,
                playbackRate: 1.0,
                isVisible: true
            });
            if (data.isFallbackLanguage) {
                showToast(data.fallbackMessage || Đang phát thuyết minh bằng ngôn ngữ dự phòng ()., 'info');
            }"""

fixed_segment = """            const poiObj = {
                id: 'poi_' + data.poiId,
                name: data.poiName,
                nameVi: data.poiName,
                imageUrl: data.imageUrl || '',
                scientificName: 'Điểm tham quan (' + (data.category || 'POI') + ')'
            };
            const duration = data.durationSeconds || 60;
            const audioSource = data.streamUrl || data.audioUrl;
            const mins = Math.floor(duration / 60);
            const secs = (duration % 60).toString().padStart(2, '0');
            const narrationData = {
                title: data.title || data.poiName,
                narrator: 'ZooGuide Audio',
                audioSrc: audioSource,
                publicUrl: data.audioUrl,
                streamUrl: data.streamUrl,
                content: data.content,
                transcript: data.content,
                durationFormatted: mins + ':' + secs,
                durationSec: duration,
                hasAudio: Boolean(audioSource)
            };
            setAudioState({
                animal: poiObj,
                narration: narrationData,
                isPlaying: Boolean(audioSource && startAutoplay),
                currentTime: 0,
                duration,
                playbackRate: 1.0,
                isVisible: true
            });
            if (data.isFallbackLanguage) {
                showToast(data.fallbackMessage || ('Đang phát thuyết minh bằng ngôn ngữ dự phòng (' + (data.languageCode || '').toUpperCase() + ').'), 'info');
            }"""

text_norm = text.replace('\r\n', '\n')
bad_norm = bad_segment.replace('\r\n', '\n')
fixed_norm = fixed_segment.replace('\r\n', '\n')

if bad_norm in text_norm:
    text_norm = text_norm.replace(bad_norm, fixed_norm)
    with open('web/src/pages/visitor/VisitorPortal.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text_norm)
    print('FIXED VISITOR PORTAL!')
else:
    print('BAD SEGMENT NOT FOUND')
