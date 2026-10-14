const counters = document.querySelectorAll(".counter");
const statsSection = document.querySelector(".stats__wrapper__container");

if (statsSection && counters.length) {

    let started = false;

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (!entry.isIntersecting || started) return;

            started = true;

            counters.forEach(counter => {

                const target = +counter.dataset.target;
                const duration = 2000;
                const startTime = performance.now();

                function update(currentTime){

                    const progress = Math.min((currentTime - startTime) / duration, 1);

                    counter.textContent = Math.floor(progress * target);

                    if(progress < 1){
                        requestAnimationFrame(update);
                    }else{
                        counter.textContent = target;
                    }
                }

                requestAnimationFrame(update);

            });

            observer.unobserve(statsSection);

        });

    },{
        threshold:0.35
    });

    observer.observe(statsSection);

}