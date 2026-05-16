package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Category;
import atomdrops.example.atomdrops.model.ConditionLevel;
import atomdrops.example.atomdrops.model.UsedImage;
import atomdrops.example.atomdrops.model.UsedItemHistory;
import atomdrops.example.atomdrops.model.UsedListing;
import atomdrops.example.atomdrops.model.UsedVideo;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.enums.UsedListingStatus;
import atomdrops.example.atomdrops.model.enums.WarrantyFlag;
import atomdrops.example.atomdrops.repository.CategoryRepository;
import atomdrops.example.atomdrops.repository.ConditionLevelRepository;
import atomdrops.example.atomdrops.repository.UsedImageRepository;
import atomdrops.example.atomdrops.repository.UsedItemHistoryRepository;
import atomdrops.example.atomdrops.repository.UsedListingRepository;
import atomdrops.example.atomdrops.repository.UsedVideoRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import atomdrops.example.atomdrops.web.dto.UsedListingRequest;
import atomdrops.example.atomdrops.web.dto.UsedListingResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UsedListingService {

    private final UsedListingRepository usedListingRepository;
    private final UsedImageRepository usedImageRepository;
    private final UsedVideoRepository usedVideoRepository;
    private final UsedItemHistoryRepository usedItemHistoryRepository;
    private final CategoryRepository categoryRepository;
    private final ConditionLevelRepository conditionLevelRepository;
    private final UserRepository userRepository;

    public UsedListingService(
            UsedListingRepository usedListingRepository,
            UsedImageRepository usedImageRepository,
            UsedVideoRepository usedVideoRepository,
            UsedItemHistoryRepository usedItemHistoryRepository,
            CategoryRepository categoryRepository,
            ConditionLevelRepository conditionLevelRepository,
            UserRepository userRepository) {
        this.usedListingRepository = usedListingRepository;
        this.usedImageRepository = usedImageRepository;
        this.usedVideoRepository = usedVideoRepository;
        this.usedItemHistoryRepository = usedItemHistoryRepository;
        this.categoryRepository = categoryRepository;
        this.conditionLevelRepository = conditionLevelRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UsedListingResponse> findAll(Optional<Long> categoryId) {
        List<UsedListing> listings = categoryId
            .map(c -> usedListingRepository.findByCategory_IdAndStatus(c, UsedListingStatus.ACTIVE))
            .orElseGet(() -> usedListingRepository.findByStatus(UsedListingStatus.ACTIVE));
        return listings.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UsedListingResponse findById(Long id) {
        UsedListing listing = usedListingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Used listing not found"));
        return toResponse(listing);
    }

    public UsedListingResponse create(Long sellerId, UsedListingRequest request) {
        User seller = userRepository.findById(sellerId)
            .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        ConditionLevel condition = conditionLevelRepository.findById(request.getConditionId())
            .orElseThrow(() -> new IllegalArgumentException("Condition not found"));

        UsedListing listing = new UsedListing();
        listing.setSeller(seller);
        listing.setCategory(category);
        listing.setConditionLevel(condition);
        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPriceBdt(request.getPriceBdt());
        listing.setWarrantyFlag(WarrantyFlag.valueOf(request.getWarrantyFlag().toUpperCase()));
        listing.setStatus(UsedListingStatus.ACTIVE);
        listing = usedListingRepository.save(listing);

        if (request.getImageUrls() != null) {
            int i = 0;
            for (String url : request.getImageUrls()) {
                UsedImage img = new UsedImage();
                img.setListing(listing);
                img.setImageUrl(url);
                img.setSortOrder(i++);
                usedImageRepository.save(img);
            }
        }

        if (request.getVideoUrls() != null) {
            for (String url : request.getVideoUrls()) {
                UsedVideo vid = new UsedVideo();
                vid.setListing(listing);
                vid.setVideoUrl(url);
                usedVideoRepository.save(vid);
            }
        }

        if (request.getOwnerCount() != null || request.getUsageDurationMonths() != null) {
            UsedItemHistory history = new UsedItemHistory();
            history.setListing(listing);
            history.setOwnerCount(request.getOwnerCount() != null ? request.getOwnerCount() : 1);
            history.setUsageDurationMonths(request.getUsageDurationMonths());
            usedItemHistoryRepository.save(history);
        }

        return toResponse(listing);
    }

    public UsedListingResponse update(Long id, Long sellerId, UsedListingRequest request) {
        UsedListing listing = usedListingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Used listing not found"));
        if (!listing.getSeller().getId().equals(sellerId)) {
            throw new IllegalArgumentException("You do not own this listing");
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            listing.setCategory(category);
        }
        if (request.getConditionId() != null) {
            ConditionLevel condition = conditionLevelRepository.findById(request.getConditionId())
                .orElseThrow(() -> new IllegalArgumentException("Condition not found"));
            listing.setConditionLevel(condition);
        }

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPriceBdt(request.getPriceBdt());
        listing.setWarrantyFlag(WarrantyFlag.valueOf(request.getWarrantyFlag().toUpperCase()));
        listing = usedListingRepository.save(listing);

        if (request.getImageUrls() != null) {
            usedImageRepository.findByListing_IdOrderBySortOrder(listing.getId())
                .forEach(img -> usedImageRepository.delete(img));
            int i = 0;
            for (String url : request.getImageUrls()) {
                UsedImage img = new UsedImage();
                img.setListing(listing);
                img.setImageUrl(url);
                img.setSortOrder(i++);
                usedImageRepository.save(img);
            }
        }

        if (request.getVideoUrls() != null) {
            usedVideoRepository.findByListing_Id(listing.getId())
                .forEach(vid -> usedVideoRepository.delete(vid));
            for (String url : request.getVideoUrls()) {
                UsedVideo vid = new UsedVideo();
                vid.setListing(listing);
                vid.setVideoUrl(url);
                usedVideoRepository.save(vid);
            }
        }

        return toResponse(listing);
    }

    public void delete(Long id, Long sellerId) {
        UsedListing listing = usedListingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Used listing not found"));
        if (!listing.getSeller().getId().equals(sellerId)) {
            throw new IllegalArgumentException("You do not own this listing");
        }
        listing.setStatus(UsedListingStatus.REMOVED);
        usedListingRepository.save(listing);
    }

    private UsedListingResponse toResponse(UsedListing listing) {
        UsedListingResponse response = new UsedListingResponse();
        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setDescription(listing.getDescription());
        response.setPriceBdt(listing.getPriceBdt());
        response.setWarrantyFlag(listing.getWarrantyFlag().name());
        response.setStatus(listing.getStatus().name());
        response.setCreatedAt(listing.getCreatedAt());

        if (listing.getSeller() != null) {
            response.setSellerId(listing.getSeller().getId());
            response.setSellerName(listing.getSeller().getDisplayName());
        }
        if (listing.getCategory() != null) {
            response.setCategoryId(listing.getCategory().getId());
            response.setCategoryName(listing.getCategory().getName());
        }
        if (listing.getConditionLevel() != null) {
            response.setConditionId(listing.getConditionLevel().getId());
            response.setConditionLabel(listing.getConditionLevel().getLabel());
        }

        List<UsedListingResponse.MediaItem> images = new ArrayList<>();
        for (UsedImage img : usedImageRepository.findByListing_IdOrderBySortOrder(listing.getId())) {
            images.add(new UsedListingResponse.MediaItem(img.getId(), img.getImageUrl(), img.getSortOrder()));
        }
        response.setImages(images);

        List<UsedListingResponse.MediaItem> videos = new ArrayList<>();
        for (UsedVideo vid : usedVideoRepository.findByListing_Id(listing.getId())) {
            videos.add(new UsedListingResponse.MediaItem(vid.getId(), vid.getVideoUrl(), 0));
        }
        response.setVideos(videos);

        usedItemHistoryRepository.findByListing_Id(listing.getId())
            .ifPresent(history -> response.setHistory(
                new UsedListingResponse.History(history.getId(), history.getOwnerCount(), history.getUsageDurationMonths())
            ));

        return response;
    }
}
