package com.teamflow.service.interfaces;

import com.teamflow.dto.SearchResultDTO;
import java.util.List;

public interface SearchService {
    List<SearchResultDTO> search(String query);
}
