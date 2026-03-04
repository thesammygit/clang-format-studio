import { create } from 'zustand';
import type { OptionsMetadata } from './api';

const DEFAULT_CODE = `#include <iostream>
#include <vector>
#include <string>
#include <memory>

namespace myapp {

class DataProcessor {
public:
    DataProcessor(const std::string& name, int capacity)
        : name_(name), capacity_(capacity), data_() {}

    void addItem(const std::string& item) {
        if (data_.size() >= static_cast<size_t>(capacity_)) {
            throw std::runtime_error("Capacity exceeded");
        }
        data_.push_back(item);
    }

    template<typename Predicate>
    std::vector<std::string> filter(Predicate pred) const {
        std::vector<std::string> result;
        for (const auto& item : data_) {
            if (pred(item)) {
                result.push_back(item);
            }
        }
        return result;
    }

    void process() {
        for (auto& item : data_) {
            if (item.empty()) { continue; }
            item[0] = std::toupper(item[0]);
        }
    }

private:
    std::string name_;
    int capacity_;
    std::vector<std::string> data_;
};

} // namespace myapp

int main(int argc, char* argv[]) {
    auto processor = std::make_unique<myapp::DataProcessor>("demo", 100);
    processor->addItem("hello");
    processor->addItem("world");
    processor->process();

    auto results = processor->filter([](const std::string& s) {
        return s.length() > 3;
    });

    for (const auto& r : results) {
        std::cout << r << std::endl;
    }
    return 0;
}
`;

interface StoreState {
  config: Record<string, unknown>;
  defaults: Record<string, unknown>;
  originalCode: string;
  formattedCode: string;
  options: OptionsMetadata;
  version: string;
  versionAvailable: boolean;
  viewMode: 'formatted' | 'diff';
  isFormatting: boolean;
  activePreset: string;

  setConfig: (config: Record<string, unknown>) => void;
  updateOption: (key: string, value: unknown) => void;
  setDefaults: (defaults: Record<string, unknown>) => void;
  setOriginalCode: (code: string) => void;
  setFormattedCode: (code: string) => void;
  setOptions: (options: OptionsMetadata) => void;
  setVersion: (version: string, available: boolean) => void;
  setViewMode: (mode: 'formatted' | 'diff') => void;
  setIsFormatting: (v: boolean) => void;
  setActivePreset: (preset: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  config: {},
  defaults: {},
  originalCode: DEFAULT_CODE,
  formattedCode: '',
  options: {},
  version: '',
  versionAvailable: false,
  viewMode: 'formatted',
  isFormatting: false,
  activePreset: 'LLVM',

  setConfig: (config) => set({ config }),
  updateOption: (key, value) =>
    set((s) => ({ config: { ...s.config, [key]: value } })),
  setDefaults: (defaults) => set({ defaults }),
  setOriginalCode: (originalCode) => set({ originalCode }),
  setFormattedCode: (formattedCode) => set({ formattedCode }),
  setOptions: (options) => set({ options }),
  setVersion: (version, versionAvailable) => set({ version, versionAvailable }),
  setViewMode: (viewMode) => set({ viewMode }),
  setIsFormatting: (isFormatting) => set({ isFormatting }),
  setActivePreset: (activePreset) => set({ activePreset }),
}));
