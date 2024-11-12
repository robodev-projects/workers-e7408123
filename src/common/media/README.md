# Media

Upload and serve media files from file providers.

### Usage

```typescript
import { MediaService } from '~common/media';

export class MyService {
  constructor(private readonly mediaService: MediaService) {}

  async createUserPictureUploadInstructions(userId: string, uploadRequest: MediaUploadRequestDto) {

    await this.mediaService.createMediaUploadRequest(
      {
        // resource name for the media
        //  this is used by your module to associate the media with the entity
        //  and should be validated by the module
        resourceName,

        // file detaild the user wants to upload
        fileName: uploadRequest.fileName,
        fileType: uploadRequest.fileType,
        fileSize: uploadRequest.fileSize,
        mimeType: uploadRequest.mimeType,

        // optional, accounting data for tracking usage
        module: 'my-module',
        type: 'user-image',
        resourceId: userId
      },
      {
        // suggest key for provider
        key: `my-module/user/${userId}/picture`,

        // constraints for uploaded media
        constraints: {
          mimeTypes: ['image/jpeg', 'image/png', 'image/jpeg'],
          // 2mb
          fileSize: 1024 * 1024 * 2,
        },
      }
    );
  }

  async saveUser(userId: string, { mediaId }: { mediaId: string }) {
    //  validating ensures the media was uploaded and is within the constraints
    await this.mediaService.validate(mediaId, resourceName);

    // alternatively, you can associate the media with an entity later on
    //  associations make the media easier to find and manage
    //  modules can use the type, resourceId, and resourceName as required for their usecase
    await this.mediaService.associate(mediaId, {
      resourceName: `entity/${entityId}`,
      module: "my-module",
      type: "entity-image",
      resourceId: entityId
    });

    // once validated, it is safe to use the media
    this.userRepository.save({ userId, pictureId: mediaId });
  }

  async getUser(userId: string) {
    const entity = await this.userRepository.findOne(userId);

    // get the media associated with the entity
    const { url } = await this.mediaService.createMediaFetchRequest({ id: entity.pictureId });
    return { entity, pictureUrl: url };
  }

  async getUsers() {
    const entities = await this.userRepository.find();

    // many media can be fetched at once
    this.mediaService.applyFetchRequests(entities, 'pictureId', 'picture');

    // picture is now a object of type MediaFetchInstructionsDto
  }
}
```
