# Media Library

Media library is a module that provides a way to upload media for use in any module.

### Usage

```typescript
import { MediaService } from '~common/media';
import { MediaLibrary } from '~modules/media-library';

export class MyService {
  constructor(private readonly mediaService: MediaService) {}

  async saveUser(userId: string, { mediaId }: { mediaId: string }) {
    //  validating ensures the media was uploaded and is within the constraints
    await this.mediaService.validate(mediaId, MediaLibrary.SmallImage);

    // once validated, it is safe to use the media
    this.userRepository.save({ userId, pictureId: mediaId });
  }

  async getUser(userId: string) {
    const entity = await this.userRepository.findOne(userId);
    const { url } = await this.mediaService.createMediaFetchRequest({ id: entity.pictureId });
    return { entity, pictureUrl: url };
  }

  async getUsers() {
    const entities = await this.userRepository.find();

    // many media can be fetched at once
    this.mediaService.applyFetchRequests(entities, 'pictureId', 'picture');
  }
}
```
