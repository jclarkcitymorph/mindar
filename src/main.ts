import apiRetrieveMindFileObjUrl from "./api/apiRetrieveMindFileObjUrl";
import apiRetrieveSiteConfig from "./api/apiRetrieveSiteConfig";
// import type { Control } from "./models/Controls/Control/Control";
// import MuteControl from "./models/Controls/Control/MuteControl/MuteControl";
// import PlayPauseControl from "./models/Controls/Control/PlayPauseControl/PlayPauseControl";
// import WeblinkControl from "./models/Controls/Control/WeblinkControl/WeblinkControl";
// import { Controls } from "./models/Controls/Controls";
// import HlsVideoRenderTarget from "./models/RenderTargets/HlsVideoTarget/HlsVideoRenderTarget";
// import createRenderTargetsFromSiteConfiguration from "./utils/application/createRenderTargetsFromSiteConfiguration";
import SceneManager from "./models/SceneManager";
import decomposeUrl from "./utils/web/decomposeUrl";

async function main() {
  try {
    const decomposedUrlData = decomposeUrl();
    const siteConfiguration = await apiRetrieveSiteConfig({
      decomposedUrlData,
    });
    if (!siteConfiguration.success) {
      throw new Error("Unable to retrieve site configuration");
    }
    const mindFileResp = await apiRetrieveMindFileObjUrl({
      url: siteConfiguration.data.render.mindUrl,
    });
    if (!mindFileResp.success) {
      throw new Error("Unable to retrive site mindfile url");
    }

    const mindFileUrl = mindFileResp.data;

    // const renderTargets = createRenderTargetsFromSiteConfiguration(
    //   siteConfiguration.data
    // );
    // const videoTarget = renderTargets.find(
    //   (t) => t instanceof HlsVideoRenderTarget
    // );

    // const controls: Control[] = [];

    // if (videoTarget) {
    //   controls.push(
    //     new PlayPauseControl({
    //       state: "Paused",
    //       onPointerDown: (state) => {
    //         const video = videoTarget.getVideoObj();
    //         switch (state) {
    //           case "Playing": {
    //             video?.pause();
    //             break;
    //           }
    //           case "Pressed Playing": {
    //             video?.pause();
    //             break;
    //           }
    //           case "Paused": {
    //             video?.play();
    //             break;
    //           }
    //           case "Pressed Pause": {
    //             video?.play();
    //             break;
    //           }
    //         }
    //       },
    //     }),
    //     new MuteControl({
    //       state: "Sound Off",
    //       onPointerDown: () => {
    //         const video = videoTarget.getVideoObj();
    //         if (video) {
    //           if (video.muted) {
    //             video.muted = false;
    //             video.volume = 1;
    //           } else {
    //             video.muted = true;
    //             video.volume = 0;
    //           }
    //         }
    //       },
    //     })
    //   );
    // }

    // if (siteConfiguration.data.render.webLinkUrl) {
    //   controls.push(
    //     new WeblinkControl({
    //       state: "Default",
    //       weblinkUrl: siteConfiguration.data.render.webLinkUrl,
    //     })
    //   );
    // }

    // new Controls({
    //   controls,
    // });

    new SceneManager({
      isDebugging: false,
      renderTargets: [],
      mindFileUrl,
    });
  } catch (error) {
    console.error(error);
  }
}

main();
